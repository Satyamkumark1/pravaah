# PRAVAAH — ENGINE SPECIFICATION

## Processing loop

For each input frame or synthetic frame:

1. normalize frame
2. compute optical flow
3. partition the region into grid cells
4. derive per-cell motion statistics
5. compute aggregate signals
6. classify a candidate regime
7. apply hysteresis
8. emit a state event

## Feature definitions

### Density
A proxy for occupancy/crowding within a grid cell. It must not be marketed as an exact headcount.

### Velocity
Average motion magnitude and dominant movement direction within a cell.

### Pressure
Prototype definition:

`pressure = density × velocity_variance`

Use a normalization strategy so the value is stable across cameras/resolutions.

### Direction entropy
Measure how distributed movement directions are inside the cell.

High entropy indicates that movement is less coherent.

## Regime policy

The policy must be configuration-driven.

Illustrative logic only:

```text
FLOWING:
  low pressure
  low entropy
  stable velocity

STOP_AND_GO:
  intermittent variance
  rising pressure
  directional conflict
  persistent over threshold window

TURBULENT:
  high pressure
  high entropy
  high velocity variance
  persistent for critical window
```

Exact thresholds must be calibrated with replayable data and stored in a versioned config file.

## Event schema

```json
{
  "timestamp": "ISO-8601",
  "camera_id": "CAM-03",
  "frame_id": 18342,
  "regime": "STOP_AND_GO",
  "risk": "ELEVATED",
  "warning_window_ms": 128000,
  "aggregate": {
    "density": 0.72,
    "velocity": 0.44,
    "pressure": 0.81,
    "direction_entropy": 0.67,
    "flow_coherence": 0.61
  },
  "cells": [
    {
      "row": 0,
      "col": 0,
      "regime": "FLOWING",
      "density": 0.21,
      "velocity": 0.62,
      "pressure": 0.11,
      "direction_entropy": 0.19
    }
  ]
}
```

## Hysteresis contract

State transitions must use a persistence rule.

Recommended prototype fields:

- `candidate_regime`
- `candidate_since`
- `committed_regime`
- `min_hold_ms`
- `cooldown_ms`

A single noisy observation must not create a visible regime switch.

## Reproducibility

Every simulator run should log:
- scenario id
- seed
- classifier config version
- engine version
