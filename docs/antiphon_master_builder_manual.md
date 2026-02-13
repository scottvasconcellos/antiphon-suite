# Antiphon Master Builder Manual

## Purpose
This manual distills the constitutional rules, arc checkpoints, and layer-agents that govern every Antiphon Master Builder run. Think of it as the checklist you read before doing anything significant.

## Command Cycle & Arcs
- **Seven-agent cycle:** foundation → structure → skin → (repeat as needed for each feature or milestone). Always finish one arc before moving to the next. Each arc is a mini delivery: research (foundation), architectural/structural wiring (structure), and experience polish (skin).
- **Operational rule:** Do not pause mid-arc. Keep moving until one of the force-stop criteria triggers: foundation checkpoint (Layers 0-1), structure checkpoint (Layers 2-5), skin checkpoint (Layers 6-8), new engine specification trigger, persistent logic bug after a Mini attempt, final pre-release audit (R2/R3).
- **Progress updates:** Provide brief notes each time work begins on a new arc; avoid extra chatter otherwise.
- **Primary action (written in stone):** Continue execution by default. Stopping work is prohibited unless a listed force-stop trigger is active.

## Force-Stop Criteria
1. **Foundation checkpoint (Layers 0-1)** – stop if you reach a major deliverable that explicitly closes Layer 1 (e.g., Layer 0 Hub scaffolding + Layer 1 scope) and await confirmation before continuing.
2. **Structure checkpoint (Layers 2-5)** – during wider platform work, pause when Layer 2-5 structure is defined and needs client validation.
3. **Skin checkpoint (Layers 6-8)** – stop for visual/UX finalization and approvals.
4. **New engine specification trigger** – stop immediately and escalate if architecture warrants a fresh engine spec beyond current scope.
5. **Persistent logic bug after Mini attempt** – stop, inspect, and report if Mini-run logic errors cannot be resolved quickly.
6. **Final pre-release audit (R2/R3)** – halt for audit documentation, runbooks, or certification steps.

## Layer Guidance
### Layer 0: Silent Entitlement Hub (foundation)
- Deliver authentication spine, entitlement authority, install/update channels, offline license cache.
- Priority: minimal UI, deterministic install states, branded tokens from `design-system/premium-dark-mode/*`.

### Layer 1: Project Scope Agent (structure)
- Convert Layer 0 philosophy into explicit scope, epics, and acceptance criteria (see `docs/layer1_project_scope_hub.md`).
- Document what is in/out, list immediate stories and non-negotiables, and keep a running status for pending workstreams.

### Layers 2-8 (future arcs)
- Follow the same rhythm: research requirements, build structure, refine skin, then hit next force stop as needed.
- Always tie new layers back to the silent/utility ethos stated in `docs/layer0_antiphon_hub.md`.

## Execution Checklist
- `pnpm install` once per repo refresh; use `pnpm --filter @antiphon/layer0-hub build`/`typecheck` to verify.
- Keep manual references current (update this file whenever an instruction or candidate stop changes).
- Document all major actions (scaffolding, architecture decisions, tooling updates) inside `docs/` for traceability.
- Avoid branching narratives: keep the arc you are working on singular until the force stop happens.

## Communication Expectations
- Provide progress statements at the start of each arc only; otherwise, silence unless forced stop or question is necessary.
- In final reports, include `Next Step Check` (status/next task/routing) with mention of manual compliance.
