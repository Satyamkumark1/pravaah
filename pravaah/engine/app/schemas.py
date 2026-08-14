"""
Pravaah Engine — Shared Event & Domain Schemas (Pydantic v2)

These models define the single source of truth for all typed events
emitted by the engine.
"""

from __future__ import annotations

from enum import Enum
from typing import Literal, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# Regime & Risk enums — centralized, never duplicated across files
# ---------------------------------------------------------------------------

class Regime(str, Enum):
    FLOWING = "FLOWING"
    STOP_AND_GO = "STOP_AND_GO"
    TURBULENT = "TURBULENT"


class RiskLevel(str, Enum):
    LOW = "LOW"
    ELEVATED = "ELEVATED"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Per-cell features
# ---------------------------------------------------------------------------

class CellFeatures(BaseModel):
    row: int
    col: int
    regime: Regime
    density: float = Field(ge=0.0, le=1.0)
    velocity: float = Field(ge=0.0, le=1.0)
    pressure: float = Field(ge=0.0, le=1.0)
    direction_entropy: float = Field(ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# Aggregate features
# ---------------------------------------------------------------------------

class AggregateFeatures(BaseModel):
    density: float = Field(ge=0.0, le=1.0)
    velocity: float = Field(ge=0.0, le=1.0)
    pressure: float = Field(ge=0.0, le=1.0)
    direction_entropy: float = Field(ge=0.0, le=1.0)
    flow_coherence: float = Field(ge=0.0, le=1.0)


# ---------------------------------------------------------------------------
# Camera state event — core payload emitted every tick
# ---------------------------------------------------------------------------

class CameraStatePayload(BaseModel):
    camera_id: str
    frame_id: int
    regime: Regime
    risk: RiskLevel
    warning_window_ms: Optional[int] = None  # None when not in warning state
    aggregate: AggregateFeatures
    cells: list[CellFeatures]


# ---------------------------------------------------------------------------
# Incident events
# ---------------------------------------------------------------------------

class IncidentPayload(BaseModel):
    incident_id: str
    camera_id: str
    regime: Regime
    risk: RiskLevel
    description: str
    acknowledged: bool = False


class IncidentUpdatePayload(BaseModel):
    incident_id: str
    acknowledged: bool
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# System / infrastructure events
# ---------------------------------------------------------------------------

class SystemStatusPayload(BaseModel):
    edge_status: Literal["ONLINE", "DEGRADED", "OFFLINE"]
    processing_fps: float
    ws_clients: int
    last_heartbeat: str  # ISO-8601
    engine_version: str


# ---------------------------------------------------------------------------
# Envelope — all WebSocket messages share this wrapper
# ---------------------------------------------------------------------------

class WSEvent(BaseModel):
    type: Literal[
        "camera_state",
        "incident_opened",
        "incident_updated",
        "incident_closed",
        "system_status",
    ]
    version: int = 1
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: (
        CameraStatePayload
        | IncidentPayload
        | IncidentUpdatePayload
        | SystemStatusPayload
    )

    model_config = {"use_enum_values": True}


# ---------------------------------------------------------------------------
# REST response models
# ---------------------------------------------------------------------------

class CameraMetadata(BaseModel):
    camera_id: str
    location: str
    description: str
    current_regime: Optional[Regime] = None  # None until a video has been processed
    current_risk: Optional[RiskLevel] = None
    online: bool = False  # True only while a video is actively processing


class IncidentSummary(BaseModel):
    incident_id: str
    camera_id: str
    location: str
    regime: Regime
    risk: RiskLevel
    opened_at: str
    closed_at: Optional[str] = None
    acknowledged: bool = False
    description: str


# ---------------------------------------------------------------------------
# Video risk summary — aggregated result of one uploaded-video processing run
# ---------------------------------------------------------------------------

class RegimeCounts(BaseModel):
    FLOWING: int = 0
    STOP_AND_GO: int = 0
    TURBULENT: int = 0


class VideoSummary(BaseModel):
    camera_id: str
    status: Literal["PROCESSING", "COMPLETE"]
    frames_processed: int
    regime_counts: RegimeCounts
    peak_regime: Regime
    peak_risk: RiskLevel
    incidents_triggered: int
    started_at: str
    completed_at: Optional[str] = None
