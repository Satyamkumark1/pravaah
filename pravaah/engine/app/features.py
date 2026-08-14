"""
Pravaah Engine — Feature Extraction

Pure, stateless functions that compute per-cell and aggregate motion features
from a numpy motion field. All functions accept explicit inputs and return
typed outputs — no hidden state or global mutation.

Feature definitions (from spec 03_ENGINE_SPEC.md):
  density          — crowd occupancy proxy within the cell
  velocity         — average motion magnitude (normalized)
  pressure         — density × velocity_variance (normalized)
  direction_entropy — directional disorder/spread in the cell
  flow_coherence   — complement of the aggregate direction entropy
"""

from __future__ import annotations

import numpy as np

from app.config import (
    GRID_ROWS,
    GRID_COLS,
    MAX_OPTICAL_FLOW_MAGNITUDE,
    MAX_VELOCITY_VARIANCE,
    PRESSURE_NORMALIZATION_SCALE,
)
from app.schemas import CellFeatures, AggregateFeatures, Regime


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def _clip_and_normalize(value: float, max_value: float) -> float:
    """Clip a raw value to [0, max_value] then normalize to [0, 1]."""
    return float(np.clip(value / max(max_value, 1e-9), 0.0, 1.0))


def direction_entropy(flow_u: np.ndarray, flow_v: np.ndarray, n_bins: int = 8) -> float:
    """
    Compute Shannon entropy of flow direction histogram over n_bins angular bins.

    Returns 0.0 (perfectly coherent) to 1.0 (maximally disordered).
    An empty cell returns 0.0 (no motion → not disordered).
    """
    magnitudes = np.sqrt(flow_u**2 + flow_v**2)
    moving_mask = magnitudes > 0.5  # ignore near-zero flow vectors

    if not np.any(moving_mask):
        return 0.0

    angles = np.arctan2(flow_v[moving_mask], flow_u[moving_mask])  # [-π, π]
    counts, _ = np.histogram(angles, bins=n_bins, range=(-np.pi, np.pi))
    counts = counts.astype(float)
    total = counts.sum()

    if total == 0:
        return 0.0

    probs = counts / total
    # Shannon entropy, normalized by log(n_bins) so result is in [0, 1]
    nonzero = probs[probs > 0]
    raw_entropy = -np.sum(nonzero * np.log(nonzero))
    max_entropy = np.log(n_bins)
    return float(np.clip(raw_entropy / max_entropy, 0.0, 1.0))


# ---------------------------------------------------------------------------
# Per-cell feature extraction
# ---------------------------------------------------------------------------

def extract_cell_features(
    flow_u: np.ndarray,
    flow_v: np.ndarray,
    motion_mask: np.ndarray,
    row: int,
    col: int,
    prev_velocity: float = 0.0,
    regime: Regime = Regime.FLOWING,
) -> CellFeatures:
    """
    Derive all four features for a single grid cell.

    Args:
        flow_u: horizontal optical flow component for this cell (H×W)
        flow_v: vertical optical flow component for this cell (H×W)
        motion_mask: binary mask — 1 where motion detected (H×W)
        row, col: grid position (for output labeling)
        prev_velocity: previous frame's normalized velocity (for variance calc)
        regime: tentative regime label (set by classifier after this step)

    Returns:
        CellFeatures with all four features normalized to [0, 1]
    """
    n_pixels = flow_u.size
    if n_pixels == 0:
        return CellFeatures(
            row=row, col=col, regime=regime,
            density=0.0, velocity=0.0, pressure=0.0, direction_entropy=0.0
        )

    # Density: fraction of cell pixels with detected motion
    density = float(np.clip(motion_mask.sum() / n_pixels, 0.0, 1.0))

    # Velocity: mean magnitude of non-zero flow, normalized
    magnitudes = np.sqrt(flow_u**2 + flow_v**2)
    mean_magnitude = float(magnitudes.mean()) if magnitudes.size > 0 else 0.0
    velocity = _clip_and_normalize(mean_magnitude, MAX_OPTICAL_FLOW_MAGNITUDE)

    # Velocity variance (for pressure): spread of magnitudes across cell.
    # Normalized against its own calibrated ceiling, not the linear velocity
    # ceiling squared — variance is a second-moment quantity with a very
    # different real-world scale (see MAX_VELOCITY_VARIANCE).
    velocity_variance = float(magnitudes.var()) if magnitudes.size > 1 else 0.0
    velocity_variance_norm = _clip_and_normalize(
        velocity_variance, MAX_VELOCITY_VARIANCE
    )

    # Pressure: density × velocity_variance (spec prototype definition)
    pressure = float(np.clip(
        density * velocity_variance_norm * PRESSURE_NORMALIZATION_SCALE, 0.0, 1.0
    ))

    # Direction entropy
    entropy = direction_entropy(flow_u, flow_v)

    return CellFeatures(
        row=row,
        col=col,
        regime=regime,
        density=round(density, 4),
        velocity=round(velocity, 4),
        pressure=round(pressure, 4),
        direction_entropy=round(entropy, 4),
    )


# ---------------------------------------------------------------------------
# Grid partitioning
# ---------------------------------------------------------------------------

def partition_flow_into_grid(
    flow_u: np.ndarray,
    flow_v: np.ndarray,
    motion_mask: np.ndarray,
    rows: int = GRID_ROWS,
    cols: int = GRID_COLS,
) -> list[tuple[int, int, np.ndarray, np.ndarray, np.ndarray]]:
    """
    Split full-frame optical flow into (rows × cols) grid cells.

    Returns list of (row, col, cell_u, cell_v, cell_mask) tuples.
    """
    h, w = flow_u.shape
    cell_h = h // rows
    cell_w = w // cols
    cells = []

    for r in range(rows):
        for c in range(cols):
            r0, r1 = r * cell_h, (r + 1) * cell_h
            c0, c1 = c * cell_w, (c + 1) * cell_w
            cells.append((
                r, c,
                flow_u[r0:r1, c0:c1],
                flow_v[r0:r1, c0:c1],
                motion_mask[r0:r1, c0:c1],
            ))

    return cells


# ---------------------------------------------------------------------------
# Aggregate feature extraction
# ---------------------------------------------------------------------------

def compute_aggregate(cell_features_list: list[CellFeatures]) -> AggregateFeatures:
    """
    Compute scene-wide aggregate features from all cell features.

    flow_coherence = 1.0 − mean(direction_entropy) across cells.
    """
    if not cell_features_list:
        return AggregateFeatures(
            density=0.0, velocity=0.0, pressure=0.0,
            direction_entropy=0.0, flow_coherence=1.0
        )

    density = float(np.mean([c.density for c in cell_features_list]))
    velocity = float(np.mean([c.velocity for c in cell_features_list]))
    pressure = float(np.mean([c.pressure for c in cell_features_list]))
    direction_entropy = float(np.mean([c.direction_entropy for c in cell_features_list]))
    flow_coherence = float(np.clip(1.0 - direction_entropy, 0.0, 1.0))

    return AggregateFeatures(
        density=round(density, 4),
        velocity=round(velocity, 4),
        pressure=round(pressure, 4),
        direction_entropy=round(direction_entropy, 4),
        flow_coherence=round(flow_coherence, 4),
    )
