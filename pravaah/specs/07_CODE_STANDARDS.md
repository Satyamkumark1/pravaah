# PRAVAAH — CODE STANDARDS

## General

- Favor clarity over cleverness.
- Prefer pure functions.
- Keep modules cohesive.
- Avoid premature abstraction.
- Do not duplicate regime constants.

## TypeScript

- strict mode enabled
- no implicit any
- explicit shared domain types
- avoid `any` unless documented and unavoidable
- use discriminated unions for event types
- keep components focused
- keep data fetching/state orchestration outside presentational components where practical

Example:

```ts
type Regime = 'FLOWING' | 'STOP_AND_GO' | 'TURBULENT';
```

## Python

- type hints
- dataclasses/Pydantic models for structured data
- functions should have one clear purpose
- no global mutable state
- configuration injected, not buried in logic
- deterministic algorithms should be deterministic under the same inputs/config

## Naming

Use domain terminology exactly:

- `stop_and_go`
- `direction_entropy`
- `warning_window_ms`
- `flow_coherence`

Do not invent synonyms like `yellowMode`, `chaosScore`, etc.

## Error handling

- handle expected failures explicitly
- add context to logs
- never silently ignore exceptions
- surface user-safe errors to UI

## Configuration

Thresholds, frame rates, hold durations, and scenario timing belong in config files or named constants.

## Logging

Structured logs should include:
- timestamp
- module
- camera_id where relevant
- event type
- error code where relevant

## Git hygiene

Commit messages should be concise and scoped:

`feat(engine): add hysteresis classifier`
`feat(ui): add simulator timeline`
`fix(ws): debounce reconnect`
`test(engine): cover turbulence thresholds`
