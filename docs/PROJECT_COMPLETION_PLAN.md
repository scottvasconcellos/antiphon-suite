# Antiphon Hub Completion Plan (RC1)

This plan is the execution companion to `/docs/codex-starter-lean.xml` and is constrained by `/docs/layer0_antiphon_hub.md`.

## 1) Outcome Definition (What “finished” means)

The Hub is finished for RC1 when all are true:

1. Users authenticate once and receive deterministic entitlement outcomes.
2. Install/update/rollback flows are deterministic and explain failures with stable reason codes.
3. Offline trust artifacts preserve hub-optional usage after authorization.
4. Operator commands are minimal, reliable, and reproducible from a clean checkout.
5. Legacy music-engine residue cannot influence Layer 1 runtime behavior.
6. The system passes full validation consistently without manual patching.

## 2) Ruthless Priority Stack

Priority order for all work:

1. **Protect Layer 0 truth** (silent infrastructure, anti-DRM, no scope creep).
2. **Reduce complexity while preserving guarantees**.
3. **Increase real operator value** (fewer steps, clearer outcomes).
4. **Only then** add capability.

## 3) RC1 Execution Phases

## Phase A — De-noise and Boundary Tightening

Goal: remove conceptual/maintenance fat without reducing safety.

Tasks:
1. Remove dead helper code in active paths (unused exports and stale adapters).
2. Isolate non-Layer1 artifacts from day-to-day developer surface (index docs, explicit legacy folder docs).
3. Ensure active runtime and public API surface do not import frozen music-engine modules.
4. Keep all current proofs passing after cleanup.

Done criteria:
- No runtime dependency from active control-plane path into frozen legacy modules.
- Public API and gate checks remain stable.
- No net increase in script/check count.

## Phase B — Authority Realism Hardening

Goal: ensure control-plane behavior holds under practical operational stress.

Tasks:
1. Expand failure-path realism in install/update authority where behavior is currently stubbed.
2. Validate remediation quality and consistency for top operator failure classes.
3. Verify persistence and trust artifact handling under restart/interruption sequences.
4. Keep deterministic snapshots compact; prune redundant fixtures where possible.

Done criteria:
- High-frequency failure classes have deterministic outcomes + remediations.
- Recovery state is always legal and stable.
- No additional UI work introduced.

## Phase C — Operator Flow Compression

Goal: make operation simpler for humans while retaining strict guarantees.

Tasks:
1. Consolidate equivalent commands into one primary operator path and one finalization path.
2. Tighten README into shortest reliable runbook (install → verify → finalize).
3. Confirm clean-worktree reproducibility in detached worktree at current target commit.
4. Keep release finalization behavior strict (tag must exist and target HEAD).

Done criteria:
- One obvious daily command path, one obvious finalize path.
- Operator can execute workflow without interpreting internal architecture.

## Phase D — RC1 Finalization

Goal: produce release-grade confidence and freeze Layer 1 scope.

Tasks:
1. Run full validation suite on release candidate commit.
2. Run `npm run rc0-finalize` (or RC1 equivalent if version stamp evolves).
3. Produce deterministic final manifest and verify tag-target integrity.
4. Mark Hub as maintenance-focused and shift major innovation to Layer apps.

Done criteria:
- Full suite passes.
- Final manifest generated and contract-valid.
- Tag correctness verified.
- No unresolved scope exceptions.

## 4) Non-Negotiable Validation Set

Run before any “done” call:

- `npm run smoke`
- `npm run gate`
- `npm run rc-check`
- `node scripts/operator-contract-check.mjs`
- Any proofs already wired into `npm run gate`

## 5) Explicit Anti-Bloat Rules

1. No new governance script unless tied to a real observed failure.
2. If two scripts validate the same invariant, consolidate to one source.
3. Prefer deleting stale checks over layering more checks.
4. Keep snapshots only where they guard a real contract boundary.
5. Keep Hub UI projection-only and minimal.

## 6) Immediate Next Arc

1. Execute **Phase A** in one cohesive arc:
   - remove dead/unused active-path exports,
   - verify no legacy runtime coupling,
   - keep all required validations green.
2. Commit once with a scope-reduction message.
3. Re-run reproducibility in clean detached worktree and record result.

## 7) Reproducibility Log

- Detached worktree run completed at commit `344ebea`:
  - `pnpm install` PASS
  - `npm run gate` PASS
- Result: clean-checkout reproducibility confirmed for active control-plane workflow.
- Detached worktree run completed at commit `9c32eab`:
  - `pnpm install` PASS
  - `npm run gate` PASS
- Result: post-Phase-B hardening reproducibility reconfirmed.

## 8) Current Execution Status

- Phase A (de-noise + boundary tightening): in progress, with script and doc consolidation complete.
- Active runtime remains on control-plane surfaces; frozen legacy/music-domain files remain unstaged and excluded from scope checks.
- Required validation set is currently stable on working branch:
  - `npm run smoke`
  - `npm run gate`
  - `npm run rc-check`
  - `node scripts/operator-contract-check.mjs`

## 9) Next Highest-Leverage Arc

Phase B (Authority Realism Hardening), constrained to no new feature scope:
1. Tighten deterministic failure/remediation mapping for installer recovery edge cases.
2. Reduce fixture noise by pruning redundant snapshots that do not guard contract boundaries.
3. Re-run detached-worktree reproducibility once Phase B changes land.
