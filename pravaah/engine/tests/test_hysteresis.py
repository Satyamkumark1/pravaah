"""Tests for the hysteresis state stabilizer."""

import time
import pytest

from app.config import HysteresisConfig
from app.hysteresis import HysteresisState
from app.schemas import Regime


class TestHysteresisState:
    def _make_stabilizer(self, min_hold_ms=100, cooldown_ms=50) -> HysteresisState:
        return HysteresisState(config=HysteresisConfig(min_hold_ms=min_hold_ms, cooldown_ms=cooldown_ms))

    def test_initial_committed_regime_is_flowing(self):
        h = self._make_stabilizer()
        assert h.committed_regime == Regime.FLOWING

    def test_same_regime_stays_committed(self):
        h = self._make_stabilizer()
        for _ in range(10):
            result = h.update(Regime.FLOWING)
        assert result == Regime.FLOWING

    def test_single_frame_spike_does_not_change_state(self):
        """One frame of TURBULENT must NOT commit immediately."""
        h = self._make_stabilizer(min_hold_ms=500)
        h.update(Regime.TURBULENT)  # one spike
        h.update(Regime.FLOWING)    # back to flowing
        # Committed should still be FLOWING
        assert h.committed_regime == Regime.FLOWING

    def test_regime_commits_after_hold_duration(self):
        """After holding min_hold_ms, the candidate becomes committed."""
        hold_ms = 100
        h = self._make_stabilizer(min_hold_ms=hold_ms, cooldown_ms=10)
        # Feed TURBULENT continuously
        start = time.monotonic()
        committed = None
        while (time.monotonic() - start) < (hold_ms / 1000.0 + 0.2):
            committed = h.update(Regime.TURBULENT)
            time.sleep(0.01)

        assert committed == Regime.TURBULENT
        assert h.committed_regime == Regime.TURBULENT

    def test_candidate_reset_when_observation_changes(self):
        """If candidate changes before hold expires, timer resets."""
        h = self._make_stabilizer(min_hold_ms=500, cooldown_ms=50)
        h.update(Regime.TURBULENT)
        time.sleep(0.05)
        # Before hold expires, swap to STOP_AND_GO
        result = h.update(Regime.STOP_AND_GO)
        # Neither should be committed yet
        assert h.committed_regime == Regime.FLOWING
        assert h.candidate_regime == Regime.STOP_AND_GO

    def test_reset_sets_committed_regime(self):
        h = self._make_stabilizer()
        h.reset(Regime.TURBULENT)
        assert h.committed_regime == Regime.TURBULENT
        assert h.candidate_regime is None

    def test_candidate_cleared_when_matching_committed(self):
        """If observation matches committed, cancel any pending candidate."""
        h = self._make_stabilizer(min_hold_ms=500)
        h.update(Regime.TURBULENT)  # set candidate
        assert h.candidate_regime == Regime.TURBULENT
        h.update(Regime.FLOWING)    # back to committed
        assert h.candidate_regime is None

    def test_cooldown_prevents_immediate_recommit(self):
        """After a commit, should not recommit immediately during cooldown."""
        hold_ms = 50
        cooldown_ms = 500
        h = self._make_stabilizer(min_hold_ms=hold_ms, cooldown_ms=cooldown_ms)

        # Force commit TURBULENT
        start = time.monotonic()
        while (time.monotonic() - start) < (hold_ms / 1000.0 + 0.1):
            h.update(Regime.TURBULENT)
            time.sleep(0.01)

        assert h.committed_regime == Regime.TURBULENT

        # Now try to commit FLOWING — should be blocked by cooldown
        h.update(Regime.FLOWING)
        assert h.committed_regime == Regime.TURBULENT  # still TURBULENT during cooldown
