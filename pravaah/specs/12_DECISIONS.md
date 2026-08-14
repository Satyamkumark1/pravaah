# PRAVAAH — ARCHITECTURE DECISIONS / ADR LOG

## ADR-001 — Deterministic critical path

Decision: keep critical classification deterministic.

Reason: explainability, reproducibility, lower demo risk, easier validation.

## ADR-002 — No identity tracking

Decision: process aggregate motion patterns only.

Reason: privacy, lower complexity, aligned with product differentiation.

## ADR-003 — Edge-first

Decision: design the critical loop for on-site execution.

Reason: latency, offline operation, video privacy, venue reliability.

## ADR-004 — Simulator shares contracts with real engine

Decision: simulator output must conform to the same event schema.

Reason: frontend can later consume real inference without UI rewrite.

## ADR-005 — No database in prototype

Decision: use local/mock state for MVP.

Reason: speed, reliability, fewer deployment dependencies.

This can be revisited after hackathon validation.
