# PRAVAAH — SIMULATOR SPECIFICATION

## Purpose

The simulator provides a repeatable, judge-friendly demonstration of the system without requiring real CCTV infrastructure.

## Required scenarios

### normal_flow
Stable crowd movement.
Expected state: FLOWING.

### platform_bottleneck
Throughput becomes intermittent.
Expected transition: FLOWING -> STOP_AND_GO.

### counter_flow
Two streams begin conflicting.
Expected transition: FLOWING -> STOP_AND_GO and potentially TURBULENT.

### festival_gate
Localized queue compression and directional conflict.
Expected transition: FLOWING -> STOP_AND_GO -> TURBULENT.

### exit_compression
Movement converges at an exit.
Expected transition: FLOWING -> STOP_AND_GO -> TURBULENT.

## Deterministic replay

Each scenario includes:
- seed
- timeline
- expected checkpoints
- expected regime sequence
- expected warning-window segment

## Demo sequence

Default demo:

```text
00:00 FLOWING
00:10 FLOWING
00:20 STOP_AND_GO
00:30 STOP_AND_GO + WARNING WINDOW
00:40 TURBULENT
00:50 STOP_AND_GO
01:00 FLOWING
```

Times are illustrative and may be tuned during implementation.

## Simulator UI actions

- start
- pause
- resume
- reset
- select scenario
- speed: 0.5x / 1x / 2x

## Simulator safety

Actions such as `REDIRECT FLOW` or `OPEN EXIT` are presentation-only in the prototype. They must show a confirmation or simulated state change and must never call a real-world control system.
