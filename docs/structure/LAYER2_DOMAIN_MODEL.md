# Layer 2 - Domain Model Baseline

## Domain Principles
- Pure business logic only.
- No framework, network, or filesystem dependencies.
- Deterministic outputs for identical inputs and state.

## Core Domain Aggregates
- `IdentitySession`: authentication state, producer profile, authority trust timestamp.
- `EntitlementCatalog`: owned apps, install state, version state, update eligibility.
- `TransactionLedger`: immutable install/update outcomes and audit entries.
- `OfflineTrustWindow`: last validation, remaining days, stale/valid/empty status.

## Domain Events
- `SessionSignedIn`
- `SessionSignedOut`
- `EntitlementsRefreshed`
- `InstallRequested`
- `InstallCompleted`
- `InstallRejected`
- `UpdateRequested`
- `UpdateCompleted`
- `UpdateRejected`

## Domain Invariants
- Access to entitlement data requires authenticated session.
- Install/update requires ownership.
- Update requires installed version.
- Transaction ledger entries are append-only.
- Offline window cannot exceed policy max.
