"""
Pravaah Engine — Real Video Adapter

Reads an uploaded video file, computes dense optical flow between sampled
frames, and yields the CameraStatePayload event schema over the same
WebSocket contract the dashboard consumes (04_API_CONTRACT.md). All cv2
usage is confined to this module.

Aggregate motion only — no face recognition, no identity/person tracking
(ADR-002).
"""

from __future__ import annotations

import asyncio
import time
from typing import AsyncIterator, Optional

import cv2
import numpy as np

from app.classifier import classify_regime, derive_risk_level
from app.config import API_CONFIG, GRID_COLS, GRID_ROWS
from app.features import compute_aggregate, direction_entropy, extract_cell_features, partition_flow_into_grid
from app.hysteresis import HysteresisState
from app.schemas import AggregateFeatures, CameraStatePayload, CellFeatures, Regime
from app.warning_window import compute_warning_window_ms

MOTION_MAGNITUDE_THRESHOLD = 0.5  # matches features.py:direction_entropy's existing convention


def probe_video(path: str) -> bool:
    """Header-only check (no frame decode) that a file is a readable video."""
    cap = cv2.VideoCapture(path)
    ok = cap.isOpened()
    cap.release()
    return ok


def _frame_stride(source_fps: float, target_hz: float) -> int:
    """Downsample arbitrary source FPS to ~target_hz by decoding only every Nth frame."""
    if source_fps <= 0:
        return 1
    return max(1, round(source_fps / target_hz))


def _read_next_sample(cap: cv2.VideoCapture, stride: int) -> Optional[np.ndarray]:
    """
    Blocking: advance `stride` frames (cheap .grab() for the skipped ones),
    decode + grayscale the last. Meant to run inside asyncio.to_thread — one
    thread hop per sampled frame instead of one per cv2 call.
    """
    for _ in range(stride - 1):
        if not cap.grab():
            return None
    ok, frame = cap.read()
    if not ok:
        return None
    return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)


def _classify_cell(cell: CellFeatures) -> Regime:
    agg = AggregateFeatures(
        density=cell.density,
        velocity=cell.velocity,
        pressure=cell.pressure,
        direction_entropy=cell.direction_entropy,
        flow_coherence=1.0 - cell.direction_entropy,
    )
    return classify_regime(agg)


async def run_video_camera(
    video_path: str,
    camera_id: str,
    rows: int = GRID_ROWS,
    cols: int = GRID_COLS,
    target_hz: float = API_CONFIG.target_update_rate_hz,
) -> AsyncIterator[CameraStatePayload]:
    """
    Async generator yielding CameraStatePayload events, driven by real
    optical flow computed from the video. Ends when the video runs out of
    frames.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        cap.release()
        raise ValueError(f"Cannot open video: {video_path!r}")

    try:
        stride = _frame_stride(cap.get(cv2.CAP_PROP_FPS) or 0, target_hz)
        hysteresis = HysteresisState()
        prev_gray = await asyncio.to_thread(_read_next_sample, cap, stride)
        frame_id = 0
        stop_and_go_onset_s: Optional[float] = None
        start_s = time.monotonic()

        while prev_gray is not None:
            gray = await asyncio.to_thread(_read_next_sample, cap, stride)
            if gray is None:
                break

            flow = await asyncio.to_thread(
                cv2.calcOpticalFlowFarneback, prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
            )
            flow_u, flow_v = flow[..., 0], flow[..., 1]
            motion_mask = (np.sqrt(flow_u**2 + flow_v**2) > MOTION_MAGNITUDE_THRESHOLD).astype(np.float64)

            cells: list[CellFeatures] = []
            for r, c, cu, cvv, cm in partition_flow_into_grid(flow_u, flow_v, motion_mask, rows, cols):
                cell = extract_cell_features(cu, cvv, cm, r, c)
                cells.append(cell.model_copy(update={"regime": _classify_cell(cell)}))

            aggregate = compute_aggregate(cells)
            # Scene-level entropy, not the mean of 64 per-cell entropies: even a
            # calm cell has some local angular scatter (body-part motion, pixel
            # noise), so averaging per-cell entropy washes out whether the crowd
            # as a whole is coherent or chaotic. Pooling all flow vectors first
            # recovers that signal — verified against real footage, this alone
            # took FLOWING vs TURBULENT from a ~0.09 spread to a clean ~0.30 one.
            scene_entropy = direction_entropy(flow_u, flow_v)
            aggregate = aggregate.model_copy(update={
                "direction_entropy": scene_entropy,
                "flow_coherence": round(1.0 - scene_entropy, 4),
            })
            raw_regime = classify_regime(aggregate)
            # now_ms omitted -> HysteresisState falls back to real wall clock,
            # correct for a real/live feed (see hysteresis.py docstring).
            committed_regime = hysteresis.update(raw_regime)

            elapsed_s = time.monotonic() - start_s
            if committed_regime == Regime.STOP_AND_GO and stop_and_go_onset_s is None:
                stop_and_go_onset_s = elapsed_s
            elif committed_regime != Regime.STOP_AND_GO:
                stop_and_go_onset_s = None

            frame_id += 1
            yield CameraStatePayload(
                camera_id=camera_id,
                frame_id=frame_id,
                regime=committed_regime,
                risk=derive_risk_level(committed_regime, aggregate),
                warning_window_ms=compute_warning_window_ms(
                    committed_regime, aggregate, stop_and_go_onset_s, elapsed_s
                ),
                aggregate=aggregate,
                cells=cells,
            )

            prev_gray = gray
            await asyncio.sleep(1.0 / target_hz)  # paces to ~5Hz regardless of decode speed
    finally:
        await asyncio.to_thread(cap.release)
