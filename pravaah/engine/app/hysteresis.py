"""
Pravaah Engine — Hysteresis State Stabilizer

Prevents regime-flicker by requiring a candidate regime to persist
for min_hold_ms before it becomes the committed displayed regime.

Contract (from spec 03_ENGINE_SPEC.md):
  candidate_regime   — the regime seen in the current frame
  candidate_since    — when the current candidate was first observed
  committed_regime   — the currently displayed regime
  min_hold_ms        — minimum persistence before committing
  cooldown_ms        — post-commit cooldown window

A single noisy frame MUST NOT cause a visible regime switch.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional

from app.config import HYSTERESIS_CONFIG, HysteresisConfig
from app.schemas import Regime


@dataclass
class HysteresisState:
    """
    Mutable state container for the hysteresis stabilizer.

    One instance per camera / per video processing session.
    """

    committed_regime: Regime = Regime.FLOWING
    candidate_regime: Optional[Regime] = None
    candidate_since_ms: Optional[float] = None     # epoch ms when candidate started
    last_commit_ms: Optional[float] = None          # epoch ms of last commit
    config: HysteresisConfig = field(default_factory=lambda: HYSTERESIS_CONFIG)

    # -----------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------

    def _now_ms(self) -> float:
        return time.monotonic() * 1000.0

    def _in_cooldown(self, now_ms: float) -> bool:
        if self.last_commit_ms is None:
            return False
        return (now_ms - self.last_commit_ms) < self.config.cooldown_ms

    def _candidate_held_long_enough(self, now_ms: float) -> bool:
        if self.candidate_since_ms is None:
            return False
        return (now_ms - self.candidate_since_ms) >= self.config.min_hold_ms

    # -----------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------

    def update(self, observed_regime: Regime, now_ms: Optional[float] = None) -> Regime:
        """
        Feed one observed regime classification from the frame classifier.

        Returns the current *committed* regime (what the UI should display).
        The committed regime only changes when the candidate has persisted
        for min_hold_ms and the cooldown window has elapsed.

        now_ms: clock reading to evaluate against. Defaults to real wall-clock
        time, which is correct for a live/video feed. A caller driving a
        virtual or accelerated clock must pass its own now_ms so persistence
        is judged against that virtual time, not wall time.
        """
        if now_ms is None:
            now_ms = self._now_ms()

        # If the observation matches the current committed regime,
        # discard any pending candidate.
        if observed_regime == self.committed_regime:
            self.candidate_regime = None
            self.candidate_since_ms = None
            return self.committed_regime

        # Observation differs from committed — track it as a candidate.
        if observed_regime != self.candidate_regime:
            # New different candidate — restart the hold timer.
            self.candidate_regime = observed_regime
            self.candidate_since_ms = now_ms
            return self.committed_regime

        # Same candidate as before — check if it has held long enough.
        if self._in_cooldown(now_ms):
            return self.committed_regime

        if self._candidate_held_long_enough(now_ms):
            # Commit the candidate.
            self.committed_regime = self.candidate_regime  # type: ignore[assignment]
            self.last_commit_ms = now_ms
            self.candidate_regime = None
            self.candidate_since_ms = None

        return self.committed_regime

    def reset(self, regime: Regime = Regime.FLOWING) -> None:
        """Reset stabilizer to a known regime (e.g., new video upload)."""
        self.committed_regime = regime
        self.candidate_regime = None
        self.candidate_since_ms = None
        self.last_commit_ms = None
