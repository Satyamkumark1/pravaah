# PRAVAAH — PRODUCT REQUIREMENTS DOCUMENT

## 1. Product summary

Pravaah is a privacy-preserving crowd movement intelligence platform designed to identify abnormal movement patterns before they become critical crowd turbulence.

It does not rely on simple crowd density alerts. It analyzes motion coherence using aggregate optical-flow-derived features.

## 2. Problem

High density does not inherently mean danger. A packed metro platform or stadium can remain safe, while a lower-density crowd can become dangerous when movement becomes unstable.

The product therefore focuses on movement regimes rather than headcount alone.

## 3. Primary users

- event control-room operators
- venue security teams
- transit operations teams
- festival/temple event coordinators
- demo judges evaluating technical feasibility

## 4. User stories

### Operator
- As an operator, I can see all active cameras and their current crowd regime.
- As an operator, I can open a camera and understand why its state changed.
- As an operator, I can see a warning window before a simulated turbulent state.
- As an operator, I can inspect historical incidents.

### Demo presenter
- I can start a deterministic scenario and reproduce the Flowing -> Stop-and-Go -> Turbulent transition.
- I can explain every major signal used by the classifier.
- I can show that no identity information is required.

### Engineer
- I can replace the simulator with a real video adapter without changing dashboard contracts.
- I can test the classifier independently of the UI.

## 5. MVP scope

Must have:
- overview dashboard
- live camera grid
- camera detail
- simulator
- four signals
- regime classification
- hysteresis
- WebSocket event shape
- incident timeline
- system health

Nice to have:
- export snapshot/report
- multi-camera synchronization
- configurable thresholds in UI
- scenario authoring tools

Out of scope for MVP:
- face recognition
- identity tracking
- cloud video storage
- production auth
- billing
- autonomous physical intervention
- legal/compliance certification

## 6. Success criteria

A judge should understand the full idea in <60 seconds without reading documentation.

A demo operator should reach a live risk state in <=2 clicks.

The deterministic simulator should reproduce the same transition every run.

The dashboard should update perceived state without visible flicker.
