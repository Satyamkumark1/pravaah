"""
Pravaah Engine — FastAPI Application

REST endpoints + WebSocket broadcaster.

Endpoints (per spec 04_API_CONTRACT.md):
  GET  /health
  GET  /api/cameras
  GET  /api/cameras/{camera_id}
  POST /api/cameras/{camera_id}/video
  POST /api/cameras/{camera_id}/video/stop
  GET  /api/cameras/{camera_id}/video/summary
  GET  /api/incidents
  WS   /ws/live
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import tempfile
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.classifier import REGIME_SEVERITY, RISK_SEVERITY
from app.config import ALLOWED_VIDEO_EXTENSIONS, API_CONFIG, MAX_VIDEO_UPLOAD_BYTES
from app.schemas import (
    CameraMetadata,
    IncidentPayload,
    IncidentSummary,
    Regime,
    RegimeCounts,
    RiskLevel,
    SystemStatusPayload,
    VideoSummary,
    WSEvent,
)
from app.video_adapter import probe_video, run_video_camera
from app.ws import ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

ENGINE_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Application state
# ---------------------------------------------------------------------------

class AppState:
    """In-memory state for the prototype. No database per spec ADR-005."""

    def __init__(self) -> None:
        # Regime/risk start unset — a camera has no state until a video is
        # uploaded for it. No synthetic default is displayed as if it were
        # a real reading.
        self.cameras: dict[str, CameraMetadata] = {
            "CAM-01": CameraMetadata(camera_id="CAM-01", location="Main Gate", description="Festival main entrance"),
            "CAM-02": CameraMetadata(camera_id="CAM-02", location="Platform A", description="Metro platform A"),
            "CAM-03": CameraMetadata(camera_id="CAM-03", location="Festival Gate", description="Primary demo camera"),
            "CAM-04": CameraMetadata(camera_id="CAM-04", location="Exit Corridor", description="East exit corridor"),
            "CAM-05": CameraMetadata(camera_id="CAM-05", location="Counter-flow Zone", description="Bidirectional corridor"),
            "CAM-06": CameraMetadata(camera_id="CAM-06", location="VIP Area", description="VIP section entrance"),
        }
        self.incidents: list[IncidentSummary] = []
        self.video_tasks: dict[str, asyncio.Task] = {}  # type: ignore[type-arg]
        # camera_id -> task; per-camera slot so multiple uploaded videos run concurrently
        self.video_summaries: dict[str, VideoSummary] = {}
        # camera_id -> summary of the most recent upload's processing run


app_state = AppState()


# ---------------------------------------------------------------------------
# Incident tracker
# ---------------------------------------------------------------------------

def _open_incident(camera_id: str, regime: Regime, risk: RiskLevel) -> IncidentSummary:
    incident = IncidentSummary(
        incident_id=str(uuid.uuid4())[:8].upper(),
        camera_id=camera_id,
        location=app_state.cameras.get(camera_id, CameraMetadata(
            camera_id=camera_id, location="Unknown", description="",
            current_regime=regime, current_risk=risk
        )).location,
        regime=regime,
        risk=risk,
        opened_at=datetime.now(timezone.utc).isoformat(),
        description=f"Risk indicator: {regime.value} movement detected. Requires review.",
    )
    app_state.incidents.append(incident)
    return incident


# ---------------------------------------------------------------------------
# Real video background task
# ---------------------------------------------------------------------------

async def _video_loop(camera_id: str, video_path: str) -> None:
    """
    Background task: processes an uploaded video through the real optical-flow
    pipeline and broadcasts events. One task per camera_id, so multiple
    uploads run concurrently without touching each other's camera state.

    Also accumulates a VideoSummary (regime breakdown, peak severity,
    incident count) in app_state.video_summaries so the dashboard can show
    an overall risk summary for the run instead of just the latest frame.
    """
    last_regime: Optional[Regime] = None
    incident_opened = False

    frames_processed = 0
    regime_counts = {Regime.FLOWING: 0, Regime.STOP_AND_GO: 0, Regime.TURBULENT: 0}
    peak_regime = Regime.FLOWING
    peak_risk = RiskLevel.LOW
    incidents_triggered = 0
    started_at = datetime.now(timezone.utc).isoformat()

    def _write_summary(status: str) -> None:
        app_state.video_summaries[camera_id] = VideoSummary(
            camera_id=camera_id,
            status=status,  # type: ignore[arg-type]
            frames_processed=frames_processed,
            regime_counts=RegimeCounts(
                FLOWING=regime_counts[Regime.FLOWING],
                STOP_AND_GO=regime_counts[Regime.STOP_AND_GO],
                TURBULENT=regime_counts[Regime.TURBULENT],
            ),
            peak_regime=peak_regime,
            peak_risk=peak_risk,
            incidents_triggered=incidents_triggered,
            started_at=started_at,
            completed_at=datetime.now(timezone.utc).isoformat() if status == "COMPLETE" else None,
        )

    logger.info("Video loop started: %s", camera_id)

    try:
        async for payload in run_video_camera(video_path, camera_id=camera_id):
            if camera_id in app_state.cameras:
                cam = app_state.cameras[camera_id]
                app_state.cameras[camera_id] = CameraMetadata(
                    camera_id=cam.camera_id,
                    location=cam.location,
                    description=cam.description,
                    current_regime=payload.regime,
                    current_risk=payload.risk,
                    online=True,
                )

            await ws_manager.broadcast(WSEvent(type="camera_state", payload=payload))

            frames_processed += 1
            regime_counts[payload.regime] += 1
            if REGIME_SEVERITY[payload.regime] > REGIME_SEVERITY[peak_regime]:
                peak_regime = payload.regime
            if RISK_SEVERITY[payload.risk] > RISK_SEVERITY[peak_risk]:
                peak_risk = payload.risk

            if payload.regime == Regime.TURBULENT and not incident_opened:
                incident = _open_incident(camera_id, payload.regime, payload.risk)
                incident_payload = IncidentPayload(
                    incident_id=incident.incident_id,
                    camera_id=camera_id,
                    regime=payload.regime,
                    risk=payload.risk,
                    description=incident.description,
                )
                await ws_manager.broadcast(WSEvent(type="incident_opened", payload=incident_payload))
                incident_opened = True
                incidents_triggered += 1

            if incident_opened and payload.regime == Regime.FLOWING and last_regime == Regime.STOP_AND_GO:
                incident_opened = False

            last_regime = payload.regime
            _write_summary("PROCESSING")

    except asyncio.CancelledError:
        logger.info("Video loop cancelled: %s", camera_id)
    finally:
        app_state.video_tasks.pop(camera_id, None)
        _write_summary("COMPLETE")
        # Mark offline but keep the last observed regime/risk — a stopped
        # feed still had a real last-known state, unlike the unset default.
        if camera_id in app_state.cameras:
            cam = app_state.cameras[camera_id]
            app_state.cameras[camera_id] = CameraMetadata(
                camera_id=cam.camera_id,
                location=cam.location,
                description=cam.description,
                current_regime=cam.current_regime,
                current_risk=cam.current_risk,
                online=False,
            )
        with contextlib.suppress(OSError):
            os.unlink(video_path)


# ---------------------------------------------------------------------------
# Heartbeat background task
# ---------------------------------------------------------------------------

async def _heartbeat_loop() -> None:
    """Sends system_status heartbeats to all WS clients."""
    while True:
        await asyncio.sleep(API_CONFIG.heartbeat_interval_s)
        payload = SystemStatusPayload(
            edge_status="ONLINE",
            processing_fps=API_CONFIG.target_update_rate_hz,
            ws_clients=ws_manager.client_count,
            last_heartbeat=datetime.now(timezone.utc).isoformat(),
            engine_version=ENGINE_VERSION,
        )
        await ws_manager.broadcast(WSEvent(type="system_status", payload=payload))


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    heartbeat_task = asyncio.create_task(_heartbeat_loop())
    logger.info("Pravaah engine started v%s", ENGINE_VERSION)
    yield
    heartbeat_task.cancel()
    for task in app_state.video_tasks.values():
        if not task.done():
            task.cancel()


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Pravaah Engine API",
    description="Crowd movement intelligence engine — REST + WebSocket",
    version=ENGINE_VERSION,
    lifespan=lifespan,
)

# Configure CORS from environment variable or default to localhost for development
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "engine_version": ENGINE_VERSION,
        "ws_clients": ws_manager.client_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/cameras", response_model=list[CameraMetadata])
async def list_cameras() -> list[CameraMetadata]:
    return list(app_state.cameras.values())


@app.get("/api/cameras/{camera_id}", response_model=CameraMetadata)
async def get_camera(camera_id: str) -> CameraMetadata:
    camera = app_state.cameras.get(camera_id)
    if camera is None:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "INVALID_CAMERA", "message": "Camera not found", "request_id": str(uuid.uuid4())}},
        )
    return camera


@app.post("/api/cameras/{camera_id}/video")
async def upload_camera_video(camera_id: str, file: UploadFile = File(...)) -> dict:
    if camera_id not in app_state.cameras:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "INVALID_CAMERA", "message": "Camera not found", "request_id": str(uuid.uuid4())}},
        )

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_FILE_TYPE", "message": f"Unsupported file type: {suffix!r}", "request_id": str(uuid.uuid4())}},
        )

    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp_path = tmp.name
    total_bytes = 0
    try:
        while chunk := await file.read(1024 * 1024):
            total_bytes += len(chunk)
            if total_bytes > MAX_VIDEO_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=400,
                    detail={"error": {"code": "FILE_TOO_LARGE", "message": "Video exceeds upload size limit", "request_id": str(uuid.uuid4())}},
                )
            tmp.write(chunk)
    finally:
        tmp.close()

    if not await asyncio.to_thread(probe_video, tmp_path):
        with contextlib.suppress(OSError):
            os.unlink(tmp_path)
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_VIDEO_FILE", "message": "File could not be read as a video", "request_id": str(uuid.uuid4())}},
        )

    existing = app_state.video_tasks.get(camera_id)
    if existing and not existing.done():
        existing.cancel()
        await asyncio.sleep(0.1)

    app_state.video_tasks[camera_id] = asyncio.create_task(_video_loop(camera_id, tmp_path))
    logger.info("Video upload started: %s (%d bytes)", camera_id, total_bytes)
    return {"status": "started", "camera_id": camera_id}


@app.post("/api/cameras/{camera_id}/video/stop")
async def stop_camera_video(camera_id: str) -> dict:
    task = app_state.video_tasks.get(camera_id)
    if task and not task.done():
        task.cancel()
        await asyncio.sleep(0.1)
    return {"status": "stopped", "camera_id": camera_id}


@app.get("/api/cameras/{camera_id}/video/summary", response_model=VideoSummary)
async def get_video_summary(camera_id: str) -> VideoSummary:
    summary = app_state.video_summaries.get(camera_id)
    if summary is None:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NO_SUMMARY_AVAILABLE", "message": "No video has been processed for this camera yet", "request_id": str(uuid.uuid4())}},
        )
    return summary


@app.get("/api/incidents", response_model=list[IncidentSummary])
async def list_incidents() -> list[IncidentSummary]:
    # Deduplicate by incident_id (defensive; guards against any future duplicate append)
    seen: set[str] = set()
    unique: list[IncidentSummary] = []
    for incident in reversed(app_state.incidents):
        if incident.incident_id not in seen:
            seen.add(incident.incident_id)
            unique.append(incident)
    return list(reversed(unique))


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        # Send initial system status on connect
        init_payload = SystemStatusPayload(
            edge_status="ONLINE",
            processing_fps=API_CONFIG.target_update_rate_hz,
            ws_clients=ws_manager.client_count,
            last_heartbeat=datetime.now(timezone.utc).isoformat(),
            engine_version=ENGINE_VERSION,
        )
        await websocket.send_text(WSEvent(type="system_status", payload=init_payload).model_dump_json())

        # Keep connection open — broadcast loop handles outbound messages
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                logger.debug("WS received: %s", msg[:100])
            except asyncio.TimeoutError:
                # Ping to keep alive
                await websocket.send_text('{"type":"ping"}')

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("WS connection error: %s", exc)
    finally:
        await ws_manager.disconnect(websocket)
