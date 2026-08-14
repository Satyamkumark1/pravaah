# PRAVAAH — CLAUDE / CODING AGENT INSTRUCTIONS

## Startup protocol

When you enter the repo:

1. Read `specs/00_MASTER_PROMPT.md`.
2. Read `specs/01_PRD.md`.
3. Read the relevant domain spec before editing that domain.
4. Inspect the existing repository before creating new files.
5. Prefer modifying existing architecture over adding parallel implementations.

## Working protocol

For each task:

### Phase A — Understand
- identify user goal
- identify affected modules
- inspect existing code
- identify contracts that may change

### Phase B — Plan
Provide a short implementation plan with:
- files to change
- interfaces/contracts
- tests to add/update
- risks

### Phase C — Implement
- make the smallest coherent change
- keep the code compilable
- update tests with implementation
- avoid speculative features

### Phase D — Verify
Run the narrowest useful tests first, then the full suite.

### Phase E — Report
Summarize:
- changed files
- behavior added
- tests run
- remaining risks

## Do not

- invent missing infrastructure
- claim a model exists if it does not
- replace deterministic logic with an LLM because it is easier
- silently change API contracts
- delete tests just to make the suite green
- hide failures behind catch-all fallbacks
- introduce databases/auth unless explicitly requested
- commit secrets

## If something is ambiguous

Use the existing specs and code as the source of truth. If the ambiguity affects safety, public claims, external integrations, or destructive changes, stop and ask.

## Quality gate

Never say “done” unless the implementation and tests satisfy the relevant checklist.
