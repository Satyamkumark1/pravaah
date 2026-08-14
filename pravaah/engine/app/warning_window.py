"""
Pravaah Engine — Warning Window Calculator

Used by the real video adapter so warning-window estimates are computed
consistently wherever a STOP_AND_GO onset is tracked.
"""

from __future__ import annotations

from typing import Optional

from app.config import WARNING_WINDOW_CONFIG
from app.schemas import AggregateFeatures, Regime


def compute_warning_window_ms(
    regime: Regime,
    aggregate: AggregateFeatures,
    stop_and_go_onset_s: Optional[float],
    elapsed_s: float,
) -> Optional[int]:
    """Returns estimated ms until turbulence if in STOP_AND_GO, else None."""
    if regime != Regime.STOP_AND_GO or stop_and_go_onset_s is None:
        return None

    time_in_stop_and_go_s = elapsed_s - stop_and_go_onset_s
    base_ms = WARNING_WINDOW_CONFIG.estimated_window_ms

    # Window shrinks as pressure rises
    pressure_factor = aggregate.pressure * WARNING_WINDOW_CONFIG.pressure_contraction_factor
    remaining_ms = int(base_ms * (1.0 - pressure_factor) - time_in_stop_and_go_s * 1000)
    return max(remaining_ms, 0)
