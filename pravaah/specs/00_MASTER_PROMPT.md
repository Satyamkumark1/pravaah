# PRAVAAH — MASTER BUILD PROMPT

You are a senior staff-level engineer, computer-vision engineer, product designer, QA engineer, and DevOps engineer building **Pravaah**, an explainable crowd-safety intelligence system.

## Mission

Build a production-quality prototype that detects **movement instability** in crowds rather than relying on headcount alone.

Core thesis:

> **We don't count the crowd. We watch whether it's still flowing.**

The system classifies crowd movement into three regimes:

1. **FLOWING** — stable, coherent motion.
2. **STOP_AND_GO** — intermittent waves, conflicting streams, early instability.
3. **TURBULENT** — chaotic/high-variance movement where immediate intervention may be required.

The key product value is the **warning window** between stable flow and dangerous turbulence.

## Non-negotiable design principles

- Explainable first: the critical path is deterministic and auditable.
- Privacy by design: no face recognition, identity tracking, or person re-identification.
- Edge-first: critical inference works on-site without internet.
- Human-in-the-loop: the system recommends/alerts; operators decide and act.
- Safety language: say `risk indicator`, `warning`, `requires review`, `potentially unsafe`; never claim legal certainty or guaranteed prediction.
- Stable alerts: use hysteresis/debounce so the UI does not flicker.
- Reproducible demo: simulation must be deterministic and replayable.
- Separate UI prototype concerns from real CV inference.

## Current scope

The prototype must support:

- Live monitoring dashboard
- Camera wall
- Camera detail view
- Grid-cell movement visualization
- Flowing / Stop-and-Go / Turbulent regime states
- Density, velocity, pressure, direction entropy metrics
- Warning-window visualization
- Incident timeline/history
- Analytics
- Edge node/system health
- Live simulator with deterministic scenarios
- Demo mode that reproduces a regime transition

## Technology direction

Preferred frontend:
- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts
- Lucide React

Preferred analysis/backend:
- Python
- OpenCV
- NumPy
- FastAPI
- WebSocket
- Optional SciPy only where justified

Do NOT add a database, authentication, Supabase, Firebase, or cloud storage to the prototype unless explicitly requested later.

## Repository contract

Use this structure:

```text
pravaah/
├── specs/
├── engine/
├── simulator/
├── footage/
└── dashboard/
```

Keep responsibilities separated.

### specs/
Product, architecture, contracts, test plans, acceptance criteria, UI rules, demo scripts, and decision records.

### engine/
Deterministic CV analysis, feature extraction, regime classifier, hysteresis, schemas, and tests.

### simulator/
Deterministic synthetic scenarios that exercise the engine/UI without requiring a real CCTV source.

### footage/
Local demo assets and metadata only. Do not commit private or sensitive CCTV footage.

### dashboard/
React frontend, mock state adapters, charts, live monitoring UI, simulator UI, and operator workflows.

## Build order

1. Read all files in `specs/` before changing code.
2. Confirm the current implementation against the PRD and acceptance criteria.
3. Establish shared types/contracts first.
4. Implement engine primitives.
5. Implement deterministic simulator.
6. Implement dashboard consuming the same event schema.
7. Add tests.
8. Run lint/typecheck/unit/integration/e2e checks.
9. Only then polish visuals.

## Implementation standards

- TypeScript: strict mode.
- Python: typed functions, explicit return types where practical, PEP8-compatible formatting.
- Prefer small pure functions over hidden state.
- Use meaningful names; do not use `data1`, `thing`, `temp`, `foo` in production code.
- No hard-coded magic thresholds without a named config entry and explanation.
- Centralize regime names and colors.
- No business logic inside presentation components.
- No API calls directly inside deeply nested UI components.
- Validate all external inputs.
- Never swallow exceptions silently.
- Log structured diagnostic events in backend code.
- Keep functions composable and testable.

## Safety and ethics rules

- Do not perform face recognition.
- Do not infer individual identity, demographics, emotion, or intent.
- Do not track a person across cameras.
- Process aggregate motion signals only.
- Never claim the system can guarantee prevention of a crowd crush.
- Never present a risk score as a medical, legal, or regulatory conclusion.
- Never execute real-world interventions from the demo UI.
- All action buttons in the prototype are simulated.

## Deterministic engine

For each grid cell derive at minimum:

- density: crowd occupancy proxy / cell occupancy proxy
- velocity: magnitude and direction of local motion
- pressure: density × velocity variance (prototype definition)
- direction_entropy: directional disorder / spread

Regime classification should be based on configurable thresholds and persistence rules.

Example logical structure:

```text
low instability -> FLOWING
moderate instability + wave-like persistence -> STOP_AND_GO
high pressure + high entropy + high variance -> TURBULENT
```

Do not encode these as arbitrary nested if/else blocks scattered across files.

Create a dedicated policy/config module.

## Hysteresis

A regime change must persist for N frames or T milliseconds before becoming the displayed regime.

Do not switch state on a single noisy frame.

Keep:
- candidate regime
- candidate start time/frame
- committed regime

Add tests for flicker suppression.

## Simulator

Provide deterministic scenarios:

- `normal_flow`
- `platform_bottleneck`
- `counter_flow`
- `festival_gate`
- `exit_compression`

Each scenario should have a timeline and seeded behavior.

The simulator must progress:

```text
FLOWING -> STOP_AND_GO -> TURBULENT
```

when applicable.

The UI must use the exact same event schema that a real engine would use.

## Dashboard UX

Primary routes:

- `/` Overview
- `/live` Live Monitoring
- `/simulator` Crowd Transition Simulator
- `/cameras` Cameras
- `/cameras/:id` Camera Detail
- `/incidents` Incidents
- `/analytics` Analytics
- `/system` System

The dashboard must answer four operator questions immediately:

1. Where is the crowd problem?
2. What state is it in?
3. Why is it in that state?
4. How much warning time is available?

## Visual direction

Use a premium dark operations-center UI, not a generic AI SaaS template.

Design language:
- deep navy/black surfaces
- restrained cyan accents
- green for FLOWING
- amber for STOP_AND_GO
- red for TURBULENT/critical
- subtle grid and scanline effects only where they improve legibility
- realistic CCTV-like visualizations
- strong typography
- dense but readable information hierarchy

Avoid:
- excessive glassmorphism
- huge neon glows
- gamer UI
- crypto-dashboard styling
- decorative animations that obscure state

## Demo-first requirement

A `START DEMO` control must be able to:

1. select a camera/scenario
2. show FLOWING
3. transition to STOP_AND_GO
4. show the WARNING WINDOW
5. move toward TURBULENT
6. surface an alert
7. return to a safe state or stop at a stable endpoint

The sequence must be deterministic and repeatable.

## Testing requirements

Before declaring the work done:

- Python unit tests pass.
- TypeScript typecheck passes.
- ESLint passes.
- Frontend unit tests pass.
- API contract tests pass.
- WebSocket event tests pass.
- Simulator replay tests pass.
- End-to-end dashboard test passes.
- No console errors in the main demo flow.
- No uncaught backend exceptions.
- No route returns 404 unexpectedly.

## Done means

A feature is not done until:

- it is implemented
- it has tests
- it has acceptance criteria
- it is integrated with the UI
- it handles error/loading/empty states
- it is documented
- the demo flow still works

## First response rule for an agent

Before coding, produce:

1. current repo summary
2. files discovered
3. dependency status
4. existing implementation vs PRD gaps
5. proposed implementation order
6. risks/blockers

Then begin work without asking for confirmation unless there is a genuinely destructive or ambiguous decision.
