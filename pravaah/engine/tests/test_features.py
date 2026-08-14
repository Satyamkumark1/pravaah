"""Tests for feature extraction functions."""

import numpy as np
import pytest

from app.features import (
    _clip_and_normalize,
    direction_entropy,
    compute_aggregate,
    extract_cell_features,
)
from app.schemas import CellFeatures, Regime


class TestClipAndNormalize:
    def test_zero_input(self):
        assert _clip_and_normalize(0.0, 10.0) == 0.0

    def test_full_scale(self):
        assert _clip_and_normalize(10.0, 10.0) == 1.0

    def test_clamps_above_max(self):
        assert _clip_and_normalize(20.0, 10.0) == 1.0

    def test_midpoint(self):
        assert abs(_clip_and_normalize(5.0, 10.0) - 0.5) < 1e-6

    def test_zero_max_does_not_divide_by_zero(self):
        result = _clip_and_normalize(5.0, 0.0)
        assert 0.0 <= result <= 1.0


class TestDirectionEntropy:
    def test_empty_flow_returns_zero(self):
        u = np.zeros((4, 4))
        v = np.zeros((4, 4))
        assert direction_entropy(u, v) == 0.0

    def test_uniform_direction_is_low_entropy(self):
        """All vectors pointing right → low entropy."""
        u = np.ones((8, 8)) * 5.0
        v = np.zeros((8, 8))
        entropy = direction_entropy(u, v)
        assert entropy < 0.2

    def test_opposing_directions_is_medium_entropy(self):
        """Half pointing right, half left → medium entropy."""
        u = np.ones((8, 8)) * 5.0
        v = np.zeros((8, 8))
        u[4:, :] = -5.0  # flip second half
        entropy = direction_entropy(u, v)
        assert 0.1 < entropy < 0.8

    def test_random_directions_is_high_entropy(self):
        rng = np.random.default_rng(42)
        angles = rng.uniform(-np.pi, np.pi, (8, 8))
        u = np.cos(angles) * 5.0
        v = np.sin(angles) * 5.0
        entropy = direction_entropy(u, v)
        assert entropy > 0.6

    def test_entropy_bounded(self):
        rng = np.random.default_rng(99)
        u = rng.uniform(-10, 10, (16, 16))
        v = rng.uniform(-10, 10, (16, 16))
        entropy = direction_entropy(u, v)
        assert 0.0 <= entropy <= 1.0


class TestExtractCellFeatures:
    def _make_uniform_flow(self, h=8, w=8, magnitude=5.0):
        u = np.ones((h, w)) * magnitude
        v = np.zeros((h, w))
        mask = np.ones((h, w))
        return u, v, mask

    def test_returns_cell_features(self):
        u, v, mask = self._make_uniform_flow()
        result = extract_cell_features(u, v, mask, row=0, col=0)
        assert isinstance(result, CellFeatures)

    def test_density_full_mask(self):
        u, v, mask = self._make_uniform_flow()
        result = extract_cell_features(u, v, mask, row=0, col=0)
        assert result.density == pytest.approx(1.0, abs=0.01)

    def test_density_zero_mask(self):
        u, v, _ = self._make_uniform_flow()
        mask = np.zeros((8, 8))
        result = extract_cell_features(u, v, mask, row=0, col=0)
        assert result.density == pytest.approx(0.0, abs=0.01)

    def test_all_features_bounded(self):
        rng = np.random.default_rng(7)
        u = rng.uniform(-15, 15, (8, 8))
        v = rng.uniform(-15, 15, (8, 8))
        mask = rng.integers(0, 2, (8, 8)).astype(float)
        result = extract_cell_features(u, v, mask, row=2, col=3)
        assert 0.0 <= result.density <= 1.0
        assert 0.0 <= result.velocity <= 1.0
        assert 0.0 <= result.pressure <= 1.0
        assert 0.0 <= result.direction_entropy <= 1.0

    def test_empty_cell(self):
        u = np.zeros((0, 0))
        v = np.zeros((0, 0))
        mask = np.zeros((0, 0))
        result = extract_cell_features(u, v, mask, row=0, col=0)
        assert result.density == 0.0
        assert result.velocity == 0.0


class TestComputeAggregate:
    def test_empty_list(self):
        agg = compute_aggregate([])
        assert agg.density == 0.0
        assert agg.flow_coherence == 1.0

    def test_averages_correctly(self):
        cells = [
            CellFeatures(row=0, col=0, regime=Regime.FLOWING,
                         density=0.4, velocity=0.5, pressure=0.2, direction_entropy=0.1),
            CellFeatures(row=0, col=1, regime=Regime.FLOWING,
                         density=0.6, velocity=0.7, pressure=0.4, direction_entropy=0.3),
        ]
        agg = compute_aggregate(cells)
        assert agg.density == pytest.approx(0.5, abs=0.01)
        assert agg.velocity == pytest.approx(0.6, abs=0.01)
        assert agg.pressure == pytest.approx(0.3, abs=0.01)
        assert agg.direction_entropy == pytest.approx(0.2, abs=0.01)
        assert agg.flow_coherence == pytest.approx(0.8, abs=0.01)

    def test_flow_coherence_complement(self):
        cells = [
            CellFeatures(row=0, col=0, regime=Regime.FLOWING,
                         density=0.5, velocity=0.5, pressure=0.3, direction_entropy=0.7),
        ]
        agg = compute_aggregate(cells)
        assert agg.flow_coherence == pytest.approx(1.0 - agg.direction_entropy, abs=0.01)
