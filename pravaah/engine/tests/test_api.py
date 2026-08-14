"""API + WebSocket contract tests (see specs/04_API_CONTRACT.md, 08_TEST_PLAN.md)."""

import time

from fastapi.testclient import TestClient

from app.main import app, app_state

# Entered (never exited — process teardown handles cleanup) so every test
# shares one portal/event loop. Without this, each client call gets its own
# ephemeral portal, and any asyncio.create_task() background video loop
# started inside a request handler gets cancelled the instant that request's
# portal tears down, before it can emit anything.
client = TestClient(app)
client.__enter__()


class TestRestEndpoints:
    def test_health_ok(self):
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert "engine_version" in body

    def test_list_cameras(self):
        r = client.get("/api/cameras")
        assert r.status_code == 200
        cameras = r.json()
        assert len(cameras) >= 1
        assert {"camera_id", "location", "current_regime", "current_risk"} <= cameras[0].keys()

    def test_get_camera_found(self):
        camera_id = next(iter(app_state.cameras))
        r = client.get(f"/api/cameras/{camera_id}")
        assert r.status_code == 200
        assert r.json()["camera_id"] == camera_id

    def test_get_camera_not_found_uses_error_envelope(self):
        r = client.get("/api/cameras/NOPE")
        assert r.status_code == 404
        error = r.json()["detail"]["error"]
        assert error["code"] == "INVALID_CAMERA"
        assert "message" in error and "request_id" in error

    def test_list_incidents_returns_list(self):
        r = client.get("/api/incidents")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestVideoUpload:
    def test_upload_unknown_camera_returns_404(self):
        r = client.post("/api/cameras/NOPE/video", files={"file": ("clip.mp4", b"fake", "video/mp4")})
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "INVALID_CAMERA"

    def test_upload_rejects_bad_extension(self):
        camera_id = next(iter(app_state.cameras))
        r = client.post(f"/api/cameras/{camera_id}/video", files={"file": ("clip.txt", b"not a video", "text/plain")})
        assert r.status_code == 400
        assert r.json()["detail"]["error"]["code"] == "INVALID_FILE_TYPE"

    def test_upload_rejects_undecodable_file(self):
        camera_id = next(iter(app_state.cameras))
        r = client.post(f"/api/cameras/{camera_id}/video", files={"file": ("clip.mp4", b"not actually a video", "video/mp4")})
        assert r.status_code == 400
        assert r.json()["detail"]["error"]["code"] == "INVALID_VIDEO_FILE"

    def test_upload_starts_task_and_emits_camera_state(self, sample_video_path):
        camera_id = "CAM-02"
        with client.websocket_connect("/ws/live") as ws:
            ws.receive_json()  # initial system_status

            with open(sample_video_path, "rb") as f:
                r = client.post(f"/api/cameras/{camera_id}/video", files={"file": ("clip.avi", f, "video/x-msvideo")})
            assert r.status_code == 200
            assert r.json() == {"status": "started", "camera_id": camera_id}

            try:
                event = None
                for _ in range(30):
                    candidate = ws.receive_json()
                    if candidate["type"] == "camera_state" and candidate["payload"]["camera_id"] == camera_id:
                        event = candidate
                        break
                assert event is not None, "expected a camera_state event for the uploaded video"
                assert event["version"] == 1
                payload = event["payload"]
                assert {"camera_id", "frame_id", "regime", "risk", "aggregate", "cells"} <= payload.keys()
            finally:
                client.post(f"/api/cameras/{camera_id}/video/stop")


class TestVideoSummary:
    def test_summary_404_before_any_upload(self):
        r = client.get("/api/cameras/CAM-05/video/summary")
        assert r.status_code == 404
        assert r.json()["detail"]["error"]["code"] == "NO_SUMMARY_AVAILABLE"

    def test_summary_reflects_completed_run(self, sample_video_path):
        camera_id = "CAM-04"
        with open(sample_video_path, "rb") as f:
            r = client.post(f"/api/cameras/{camera_id}/video", files={"file": ("clip.avi", f, "video/x-msvideo")})
        assert r.status_code == 200

        summary = None
        for _ in range(50):
            r = client.get(f"/api/cameras/{camera_id}/video/summary")
            if r.status_code == 200 and r.json()["status"] == "COMPLETE":
                summary = r.json()
                break
            time.sleep(0.1)

        assert summary is not None, "expected the video processing run to complete"
        assert summary["camera_id"] == camera_id
        assert summary["frames_processed"] > 0
        counted = sum(summary["regime_counts"].values())
        assert counted == summary["frames_processed"]
        assert summary["peak_regime"] in {"FLOWING", "STOP_AND_GO", "TURBULENT"}
        assert summary["started_at"] is not None
        assert summary["completed_at"] is not None


class TestWebSocketContract:
    def test_connect_receives_system_status_envelope(self):
        with client.websocket_connect("/ws/live") as ws:
            event = ws.receive_json()
            assert event["type"] == "system_status"
            assert event["version"] == 1
            assert "timestamp" in event
            assert "engine_version" in event["payload"]

    def test_invalid_message_does_not_crash_server(self):
        with client.websocket_connect("/ws/live") as ws:
            ws.receive_json()  # initial system_status
            ws.send_text("not valid json")

        # server must still be alive for subsequent requests
        r = client.get("/health")
        assert r.status_code == 200
