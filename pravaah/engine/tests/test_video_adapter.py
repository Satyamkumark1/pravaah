"""Tests for the real video optical-flow adapter."""

import pytest

from app.config import GRID_COLS, GRID_ROWS
from app.schemas import CameraStatePayload, Regime
from app.video_adapter import _frame_stride, run_video_camera


class TestFrameStride:
    def test_downsamples_to_target_rate(self):
        assert _frame_stride(30, 5) == 6

    def test_source_at_target_rate_is_stride_one(self):
        assert _frame_stride(5, 5) == 1

    def test_unknown_fps_defaults_to_stride_one(self):
        assert _frame_stride(0, 5) == 1


class TestRunVideoCamera:
    @pytest.mark.asyncio
    async def test_produces_events(self, sample_video_path):
        events = [payload async for payload in run_video_camera(sample_video_path, "CAM-TEST")]
        assert len(events) >= 1
        assert isinstance(events[0], CameraStatePayload)

    @pytest.mark.asyncio
    async def test_frame_ids_increment(self, sample_video_path):
        events = [payload async for payload in run_video_camera(sample_video_path, "CAM-TEST")]
        frame_ids = [e.frame_id for e in events]
        assert frame_ids == sorted(frame_ids)
        assert len(set(frame_ids)) == len(frame_ids)

    @pytest.mark.asyncio
    async def test_cells_cover_full_grid(self, sample_video_path):
        events = [payload async for payload in run_video_camera(sample_video_path, "CAM-TEST")]
        assert len(events[0].cells) == GRID_ROWS * GRID_COLS

    @pytest.mark.asyncio
    async def test_coherent_motion_does_not_reach_turbulent(self, sample_video_path):
        """A single sliding square is coherent, single-direction motion —
        low direction entropy by construction, must never read as TURBULENT."""
        regimes = {payload.regime async for payload in run_video_camera(sample_video_path, "CAM-TEST")}
        assert Regime.TURBULENT not in regimes

    @pytest.mark.asyncio
    async def test_invalid_path_raises(self):
        with pytest.raises(ValueError, match="Cannot open video"):
            async for _ in run_video_camera("/nonexistent/path.mp4", "CAM-TEST"):
                pass
