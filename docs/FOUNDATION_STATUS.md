# FOUNDATION_STATUS

## Constitutional Law
- Authoritative law: `docs/codex-starter-lean.xml`
- Build order enforced: FOUNDATION -> STRUCTURE -> SKIN

## Current True State
- Layer 0 hub exists in `apps/layer0-hub` with domain/services/ui separation and authority gateway wiring.
- Layer 0 authority backend exists in `apps/layer0-authority` with health/auth/entitlement/install/update endpoints.
- Design tokens are present under `design-system/premium-dark-mode`.

## Missing / Unavailable
- Legacy manuals previously in `/docs` are currently unavailable in the working tree (deleted state detected).
- We do not recreate unavailable legacy manuals.
- This restart proceeds using `docs/codex-starter-lean.xml` as sole constitutional law.

## Executable Foundation Gates
- `pnpm build` (authority + hub build)
- `pnpm typecheck` (authority + hub typecheck)
- `pnpm test` (foundation smoke pipeline: build, typecheck, authority runtime health contract)

## Foundation Risks
- Repository currently has broad dirty state beyond core app files; baseline cleanup must be committed intentionally.
- Test depth is minimal smoke only; behavior coverage is still low.
- Layer 1+ documents from older flow are unavailable, so governance references are now narrowed to starter lean + Layer 0 doc.
