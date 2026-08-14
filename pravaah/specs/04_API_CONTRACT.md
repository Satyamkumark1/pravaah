# PRAVAAH — API + WEBSOCKET CONTRACT

## REST

### GET /health
Returns service health.

### GET /api/cameras
Returns available cameras.

### GET /api/cameras/{camera_id}
Returns camera metadata and current state.

### GET /api/incidents
Returns incident summaries.

### GET /api/scenarios
Returns simulator scenarios.

### POST /api/simulator/start
Starts a deterministic scenario.

### POST /api/simulator/stop
Stops a scenario.

## WebSocket

Endpoint:

`/ws/live`

Events:

- `camera_state`
- `incident_opened`
- `incident_updated`
- `incident_closed`
- `system_status`
- `simulator_state`

Every event must include:

```json
{
  "type": "camera_state",
  "version": 1,
  "timestamp": "ISO-8601",
  "payload": {}
}
```

Do not break the event contract without incrementing `version` and updating contract tests.

## Target prototype update rate

Approximately five state updates per second for the public dashboard simulation.

The actual engine can run at a different internal frame rate; the API may aggregate/downsample updates.

## Error format

```json
{
  "error": {
    "code": "INVALID_CAMERA",
    "message": "Camera not found",
    "request_id": "..."
  }
}
```

Never expose Python stack traces to the browser.
