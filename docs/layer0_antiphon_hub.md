# layer0_antiphon_hub.md

## Layer 0 Product Authority (Canonical)

Layer 0 defines product truth. Layer 0 does not require runtime code.

## Product Definition

Antiphon Hub is infrastructure for ownership and distribution safety for Antiphon desktop apps.

Hub purpose:
- identity authentication
- entitlement authority
- install/update authority
- offline trust cache
- launch boundary issuance/verification

Hub is not a destination. It should feel silent, fast, trustworthy, and mostly invisible.

## Core User Outcome

After one login, users can:
- have ownership recognized automatically
- install owned apps quickly
- update reliably
- switch machines without authorization rituals
- keep using authorized apps offline

## One-Sentence Truth

Antiphon Hub removes licensing friction so users can access and keep control of their Antiphon apps with minimal interruption to creative work.

## Hard Product Invariants

1) Identity-based ownership
- No product keys, activation codes, authorization slots, or visible device-limit rituals.

2) Offline-resilient entitlement
- Creative usage must not require persistent internet.
- Internet is needed only for first authentication, updates, and optional trust refresh.

3) Anti-DRM posture
- Authorized apps must remain runnable without Hub process presence.
- Hub enhances trust and install safety; Hub must not gate execution.

4) Silent operation
- Hub must not behave like a storefront or workspace.
- If users spend time in Hub, scope discipline failed.

5) Deterministic authority behavior
- Same input/state must produce same control-plane decision and reason.

## Scope: Must Exist

- Authentication spine
- Entitlement authority
- Install authority
- Update channel
- Offline trust cache
- Launch boundary
- Minimal operational telemetry

## Scope: Delay Is Acceptable

- auto-updates
- ecosystem discovery
- machine history UX
- UI polish

## Explicitly Out of Scope

- native in-Hub purchasing for MVP
- plugin distribution
- third-party app marketplace
- creative workspace features
- runtime container behavior
- collaborative environment
- cloud storage behavior
- behavioral surveillance analytics

## Commerce Boundary

MVP purchasing is external checkout (for example browser Stripe). Native financial infrastructure is out of scope for MVP.

## Telemetry Boundary

Allowed:
- crash reports
- install/update failures and success rates
- entitlement/license error classes
- OS distribution metrics

Not allowed:
- behavioral surveillance
- covert profiling
- psychological tracking

## Distribution Boundary

- Antiphon-only app distribution
- apps run as independent native processes
- no floating builds

## Failure Signals

Design failed if users perceive Hub as:
- DRM
- unclear in purpose
- unnecessary friction

## Success Signals

Layer 0 is satisfied when:
- ownership is indisputable
- install/update authority is centralized and predictable
- version chaos is prevented
- users trust the system without thinking about it
- creative flow is not interrupted

## Strategic Constraint

The long-term asset is entitlement architecture simplicity, not Hub UI complexity.
