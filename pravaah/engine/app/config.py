"""
Pravaah Engine — Configuration

All thresholds, timing constants, and regime policy parameters live here.
No magic numbers are permitted in feature extraction or classification code.
Every constant is named and explained.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import ClassVar


# ---------------------------------------------------------------------------
# Grid configuration
# ---------------------------------------------------------------------------

GRID_ROWS: int = 8
GRID_COLS: int = 8


# ---------------------------------------------------------------------------
# Feature normalization bounds
# ---------------------------------------------------------------------------

MAX_OPTICAL_FLOW_MAGNITUDE: float = 20.0  # pixels/frame; clips raw flow
PRESSURE_NORMALIZATION_SCALE: float = 1.0  # scale applied after density × var

# Velocity *variance* (used for pressure) is a second-moment quantity, not a
# linear magnitude — reusing MAX_OPTICAL_FLOW_MAGNITUDE**2 as its ceiling left
# real footage's aggregate pressure pinned near ~0.1 regardless of how busy
# the scene was, since it never came close to a 400 (20**2) denominator.
# Calibrated separately against real 720p crowd footage (~24fps, 8x8 grid,
# per-cell flow variance): calm scenes ~25, busy scenes ~55-60, peaks to
# ~270 in the single most active cells. Revisit if source footage differs
# a lot in resolution or frame rate from that.
MAX_VELOCITY_VARIANCE: float = 80.0


# ---------------------------------------------------------------------------
# Real video upload — trust-boundary limits
# ---------------------------------------------------------------------------

MAX_VIDEO_UPLOAD_BYTES: int = 200 * 1024 * 1024  # 200 MB cap for hackathon demo clips
ALLOWED_VIDEO_EXTENSIONS: frozenset[str] = frozenset({".mp4", ".mov", ".avi", ".webm", ".mkv"})


# ---------------------------------------------------------------------------
# Regime classification thresholds
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class RegimeThresholds:
    """
    Policy parameters that drive the deterministic regime classifier.

    Changing these values changes system behavior — keep them versioned.
    """

    # ---- FLOWING criteria (all must hold) ----
    # direction_entropy is computed scene-wide (pooled across the whole
    # frame's flow field), not averaged from 64 per-cell entropies — see
    # video_adapter.py. That pools out per-cell noise and uses much more of
    # the 0-1 range: real calm scenes land ~0.73-0.88, real chaotic scenes
    # ~0.88-0.99.
    #
    # All three FLOWING bounds calibrated together end-to-end (including
    # hysteresis) against 3 real AI-generated clips (safe/busy/critical.mp4):
    # flowing_max_velocity_variance is the binding constraint for calm real
    # footage — a calm clip's blended pressure/entropy score (~0.48-0.51)
    # exceeded a naively-lower ceiling even once pressure/entropy alone were
    # generous enough, silently blocking FLOWING regardless of those two.
    # At these three values: safe.mp4 -> FLOWING 38/47 frames (81%),
    # busy.mp4 stays STOP_AND_GO 44/47 frames (94%) — genuine separation,
    # not just two clips landing in the same bucket.
    flowing_max_pressure: float = 0.40
    flowing_max_entropy: float = 0.88
    # Must stay >= 0.7*flowing_max_pressure + 0.3*flowing_max_entropy (0.544)
    # or the boundary case (pressure/entropy each exactly at their own
    # ceiling) fails FLOWING on the blended score alone — self-consistency
    # bug, not a calibration choice.
    flowing_max_velocity_variance: float = 0.55

    # ---- TURBULENT criteria (all three must hold — see classifier.py) ----
    # Lowered from the original 0.65/0.90: pressure and entropy peak at
    # DIFFERENT moments in real footage, not together — a coherent fast
    # surge reads as high pressure + low entropy, chaotic milling reads as
    # high entropy + low pressure. Requiring both at their original marks
    # simultaneously was nearly unreachable by any single-mechanism clip.
    # 0.50/0.87 is calibrated against the same 3 clips: verified end-to-end
    # (including hysteresis) that safe.mp4 and busy.mp4 never cross into
    # TURBULENT, while critical.mp4 sustains it for 11 consecutive frames.
    # Revisit with real incident footage.
    turbulent_min_pressure: float = 0.50
    turbulent_min_entropy: float = 0.87
    turbulent_min_velocity_variance: float = 0.55

    # ---- STOP_AND_GO is the middle ground between FLOWING and TURBULENT ----
    # No explicit threshold needed — it is the default when neither condition matches.

    # Config version — increment when thresholds change
    config_version: ClassVar[str] = "1.0.0"


# ---------------------------------------------------------------------------
# Hysteresis / state stabilizer configuration
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class HysteresisConfig:
    """
    Controls how many milliseconds a candidate regime must persist
    before becoming the committed displayed regime.

    min_hold_ms: a candidate must be seen continuously for this duration.
    cooldown_ms: after a commit, the stabilizer ignores new candidates
                 for this additional period to prevent rapid oscillation.
    """

    min_hold_ms: int = 1500   # 1.5 s hold before committing
    cooldown_ms: int = 800    # 0.8 s cooldown after each commit


# ---------------------------------------------------------------------------
# Warning window configuration
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class WarningWindowConfig:
    """
    The WARNING WINDOW is the interval between STOP_AND_GO onset
    and TURBULENT onset. It is the core product value proposition.
    """

    # After STOP_AND_GO is committed, this is the estimated window
    # (in ms) until turbulence if conditions persist.
    estimated_window_ms: int = 120_000  # 2 minutes default estimate

    # The warning window shrinks as instability metrics rise.
    # Scale: 0.0 (no reduction) to 1.0 (full collapse)
    pressure_contraction_factor: float = 0.5


# ---------------------------------------------------------------------------
# WebSocket / API configuration
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class APIConfig:
    target_update_rate_hz: float = 5.0  # target ~5 events/second per spec
    heartbeat_interval_s: float = 2.0


# ---------------------------------------------------------------------------
# Singleton instances (import these directly in other modules)
# ---------------------------------------------------------------------------

REGIME_THRESHOLDS = RegimeThresholds()
HYSTERESIS_CONFIG = HysteresisConfig()
WARNING_WINDOW_CONFIG = WarningWindowConfig()
API_CONFIG = APIConfig()
