"""Shared pytest fixtures."""

import cv2
import numpy as np
import pytest


@pytest.fixture
def sample_video_path(tmp_path) -> str:
    """
    10 frames, 64x64 (exactly divisible by the 8x8 grid), a white square
    sliding left->right. Guarantees coherent, non-zero, single-direction
    optical flow — deterministic, no external assets.
    """
    path = str(tmp_path / "sample.avi")
    fourcc = cv2.VideoWriter_fourcc(*"MJPG")  # the only encoder this headless
    writer = cv2.VideoWriter(path, fourcc, 10.0, (64, 64))  # OpenCV build can write
    for i in range(10):
        frame = np.zeros((64, 64, 3), dtype=np.uint8)
        x = 4 + i * 5
        cv2.rectangle(frame, (x, 24), (x + 12, 40), (255, 255, 255), -1)
        writer.write(frame)
    writer.release()
    return path
