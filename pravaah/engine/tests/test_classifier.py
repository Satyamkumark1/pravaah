"""Tests for the deterministic regime classifier."""

import pytest

from app.classifier import classify_regime, derive_risk_level
from app.config import REGIME_THRESHOLDS, RegimeThresholds
from app.schemas import AggregateFeatures, Regime, RiskLevel


def _make_aggregate(
    density=0.3, velocity=0.5, pressure=0.15,
    direction_entropy=0.20, flow_coherence=0.80
) -> AggregateFeatures:
    return AggregateFeatures(
        density=density,
        velocity=velocity,
        pressure=pressure,
        direction_entropy=direction_entropy,
        flow_coherence=flow_coherence,
    )


class TestClassifyRegime:
    def test_clear_flowing(self):
        agg = _make_aggregate(pressure=0.10, direction_entropy=0.15)
        assert classify_regime(agg) == Regime.FLOWING

    def test_clear_turbulent(self):
        agg = _make_aggregate(pressure=0.80, direction_entropy=0.95, flow_coherence=0.05)
        assert classify_regime(agg) == Regime.TURBULENT

    def test_moderate_instability_is_stop_and_go(self):
        agg = _make_aggregate(pressure=0.45, direction_entropy=0.48, flow_coherence=0.52)
        assert classify_regime(agg) == Regime.STOP_AND_GO

    def test_boundary_at_flowing_threshold(self):
        """Exactly at flowing boundary → FLOWING (inclusive ≤)."""
        t = REGIME_THRESHOLDS
        agg = _make_aggregate(
            pressure=t.flowing_max_pressure,
            direction_entropy=t.flowing_max_entropy,
        )
        assert classify_regime(agg) == Regime.FLOWING

    def test_just_above_flowing_threshold(self):
        """Just above flowing boundary → NOT FLOWING."""
        t = REGIME_THRESHOLDS
        agg = _make_aggregate(
            pressure=t.flowing_max_pressure + 0.01,
            direction_entropy=t.flowing_max_entropy + 0.01,
        )
        result = classify_regime(agg)
        assert result != Regime.FLOWING

    def test_boundary_at_turbulent_threshold(self):
        """Exactly at turbulent boundary → TURBULENT (inclusive ≥)."""
        t = REGIME_THRESHOLDS
        agg = _make_aggregate(
            pressure=t.turbulent_min_pressure,
            direction_entropy=t.turbulent_min_entropy,
        )
        assert classify_regime(agg) == Regime.TURBULENT

    def test_custom_thresholds_respected(self):
        """Classifier must use passed thresholds, not global defaults."""
        strict = RegimeThresholds(
            flowing_max_pressure=0.05,  # very low — hard to be FLOWING
            flowing_max_entropy=0.05,
            flowing_max_velocity_variance=0.05,
            turbulent_min_pressure=0.95,  # very high — hard to be TURBULENT
            turbulent_min_entropy=0.95,
            turbulent_min_velocity_variance=0.95,
        )
        agg = _make_aggregate(pressure=0.40, direction_entropy=0.40)
        # With strict thresholds → STOP_AND_GO (middle ground)
        assert classify_regime(agg, thresholds=strict) == Regime.STOP_AND_GO

    def test_output_is_deterministic(self):
        """Same input always produces same output."""
        agg = _make_aggregate(pressure=0.75, direction_entropy=0.68)
        results = [classify_regime(agg) for _ in range(100)]
        assert len(set(results)) == 1


class TestDeriveRiskLevel:
    def test_flowing_is_low_risk(self):
        agg = _make_aggregate(pressure=0.10)
        assert derive_risk_level(Regime.FLOWING, agg) == RiskLevel.LOW

    def test_turbulent_is_critical(self):
        agg = _make_aggregate(pressure=0.80)
        assert derive_risk_level(Regime.TURBULENT, agg) == RiskLevel.CRITICAL

    def test_stop_and_go_low_pressure_is_elevated(self):
        agg = _make_aggregate(pressure=0.40)
        assert derive_risk_level(Regime.STOP_AND_GO, agg) == RiskLevel.ELEVATED

    def test_stop_and_go_high_pressure_is_high(self):
        """STOP_AND_GO near turbulent threshold → HIGH risk."""
        agg = _make_aggregate(pressure=0.58)  # 85% of 0.50 = 0.425
        result = derive_risk_level(Regime.STOP_AND_GO, agg)
        assert result == RiskLevel.HIGH
