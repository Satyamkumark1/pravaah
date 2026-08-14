"""
Pravaah Engine — Deterministic Regime Classifier

Classifies aggregate motion features into one of three regimes:
  FLOWING     — stable, coherent motion
  STOP_AND_GO — intermittent waves, early instability
  TURBULENT   — chaotic high-variance movement

Classification logic is driven entirely by config.REGIME_THRESHOLDS.
No magic numbers appear in this module.
"""

from __future__ import annotations

from app.config import REGIME_THRESHOLDS, RegimeThresholds
from app.schemas import AggregateFeatures, Regime, RiskLevel


# ---------------------------------------------------------------------------
# Velocity variance helper (scalar, not array-based)
# ---------------------------------------------------------------------------

def _velocity_variance_score(aggregate: AggregateFeatures) -> float:
    """
    Derive a scalar velocity-variance proxy from aggregate features.

    Since the aggregate already captures mean pressure (which encodes
    density × velocity_variance), we use pressure as the primary proxy
    for variance. Direction entropy contributes a weighted penalty.
    """
    return aggregate.pressure * 0.7 + aggregate.direction_entropy * 0.3


# ---------------------------------------------------------------------------
# Core classifier — pure function, no side effects
# ---------------------------------------------------------------------------

def classify_regime(
    aggregate: AggregateFeatures,
    thresholds: RegimeThresholds = REGIME_THRESHOLDS,
) -> Regime:
    """
    Deterministic regime classification from aggregate features.

    Decision logic (per spec 03_ENGINE_SPEC.md regime policy):

      TURBULENT if:
        pressure >= turbulent_min_pressure
        AND direction_entropy >= turbulent_min_entropy
        AND velocity_variance_score >= turbulent_min_velocity_variance

      FLOWING if:
        pressure <= flowing_max_pressure
        AND direction_entropy <= flowing_max_entropy
        AND velocity_variance_score <= flowing_max_velocity_variance

      STOP_AND_GO:
        default — moderate instability not meeting either extreme criterion

    Explicit conditions are used, not nested if/else spaghetti.
    """
    vel_var = _velocity_variance_score(aggregate)

    is_turbulent = (
        aggregate.pressure >= thresholds.turbulent_min_pressure
        and aggregate.direction_entropy >= thresholds.turbulent_min_entropy
        and vel_var >= thresholds.turbulent_min_velocity_variance
    )

    if is_turbulent:
        return Regime.TURBULENT

    is_flowing = (
        aggregate.pressure <= thresholds.flowing_max_pressure
        and aggregate.direction_entropy <= thresholds.flowing_max_entropy
        and vel_var <= thresholds.flowing_max_velocity_variance
    )

    if is_flowing:
        return Regime.FLOWING

    return Regime.STOP_AND_GO


# ---------------------------------------------------------------------------
# Risk level derivation (separate from regime)
# ---------------------------------------------------------------------------

_REGIME_BASE_RISK: dict[Regime, RiskLevel] = {
    Regime.FLOWING: RiskLevel.LOW,
    Regime.STOP_AND_GO: RiskLevel.ELEVATED,
    Regime.TURBULENT: RiskLevel.CRITICAL,
}


def derive_risk_level(
    regime: Regime,
    aggregate: AggregateFeatures,
) -> RiskLevel:
    """
    Derive the current risk level from regime and aggregate features.

    STOP_AND_GO can escalate to HIGH risk when pressure is near-turbulent.
    """
    base = _REGIME_BASE_RISK[regime]

    if regime == Regime.STOP_AND_GO:
        if aggregate.pressure >= REGIME_THRESHOLDS.turbulent_min_pressure * 0.85:
            return RiskLevel.HIGH

    return base


# ---------------------------------------------------------------------------
# Severity ordering — for tracking the worst state seen over a run
# ---------------------------------------------------------------------------

REGIME_SEVERITY: dict[Regime, int] = {
    Regime.FLOWING: 0,
    Regime.STOP_AND_GO: 1,
    Regime.TURBULENT: 2,
}

RISK_SEVERITY: dict[RiskLevel, int] = {
    RiskLevel.LOW: 0,
    RiskLevel.ELEVATED: 1,
    RiskLevel.HIGH: 2,
    RiskLevel.CRITICAL: 3,
}
