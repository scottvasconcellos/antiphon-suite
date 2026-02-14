# codex-starter-lean.xml (Plain English Copy)

This file explains the active XML manual in everyday language.

## Priority Order
1. Layer 0 document is the highest authority.
2. The XML manual is second.
3. If they conflict, Layer 0 wins.

## How execution should run
- Work continuously and autonomously.
- Do not stop for routine updates or confirmations.
- Keep changes small, deterministic, and high value.

## The only reasons to stop
1. Layer 0 meaning is unclear for the current implementation choice.
2. You need a model upgrade to finish safely.
3. You are entering Figma/design implementation and need the design package.
4. There is an emergency or destructive-risk situation.
5. You detect architecture drift that cannot be fixed locally.

## Scope guardrails
- Hub is Layer 1 control-plane only.
- No music-intelligence runtime work in Hub.
- No UI expansion unless Layer 0 requires it.
- Legacy music-domain files remain excluded from active runtime.

## Determinism rules
- Same inputs/state must produce same outputs.
- Use stable ordering and stable output shapes.
- Keep reasonCode to remediation mapping canonical.

## Minimum checks before declaring completion
- npm run smoke
- npm run gate
- npm run rc-check
- node scripts/operator-contract-check.mjs

## Model policy
- Default: GPT-5.3-Codex Low.
- Escalate only for hard architectural/refactor/debug/release conditions.
- Return to Low when escalated work is complete.

## Reporting policy
- Report only at major milestones or mandatory stops.
- Use plain English: what changed, where we are, and what is next.
