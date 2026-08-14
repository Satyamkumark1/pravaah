# PRAVAAH — SYSTEM ARCHITECTURE

## Critical path

```text
CCTV / Video
    |
    v
Frame Adapter
    |
    v
Optical Flow
    |
    v
Grid-cell Features
    |
    +--> Density
    +--> Velocity
    +--> Pressure
    +--> Direction Entropy
    |
    v
Deterministic Regime Classifier
    |
    v
Hysteresis / State Stabilizer
    |
    +------------------------------+
    |                              |
    v                              v
FastAPI Event Adapter          Incident Recorder
    |
    v
WebSocket
    |
    v
Dashboard
```

## Edge architecture

The critical detection loop is designed to run on an on-site machine.

```text
Camera -> Edge PC -> Pravaah Engine -> Local FastAPI/WebSocket -> Dashboard
```

Internet is optional for critical analysis.

## Prototype deployment

Public prototype can use:
- frontend: Vercel
- FastAPI demo backend: Render or another low-cost/free prototype host
- mock/simulated events: preferred for public demo

Do not stream real venue CCTV to a free public service.

## Real deployment

Use an on-venue edge computer for video analysis. Cloud can be used later for fleet management, telemetry, historical aggregates, configuration, or remote observability, but it must not be required for the critical decision loop.

## Module boundaries

### Engine
Input: frames / synthetic motion fields.
Output: typed cell features and regime state.

### Simulator
Input: scenario definition.
Output: synthetic frames/events using the same engine contracts.

### API
Input: engine state.
Output: WebSocket events and REST metadata.

### Dashboard
Input: typed API events.
Output: operator visualization.

Never let the dashboard calculate authoritative regime state.
