# Layer 3 - Service Boundaries

## Authority Service Contracts
- `GET /health` -> service liveness contract.
- `POST /auth/session` -> create session from validated email.
- `DELETE /auth/session` -> end session.
- `GET /entitlements` -> returns catalog for active session.
- `POST /entitlements/refresh` -> refresh trust window and entitlement freshness.
- `GET /offline-cache/status` -> offline trust state.
- `GET /transactions` -> install/update history.
- `POST /installs/:appId` -> install orchestration.
- `POST /updates/:appId` -> update orchestration.

## Hub Service Adapters
- `AuthorityGateway`: typed adapter over authority contracts.
- `SessionStore`: local session persistence wrapper.
- `InstallOrchestrator`: service-level wrapper for install/update command flow.

## Service Constraints
- Services may depend on platform APIs and network.
- Services return normalized DTOs; domain mapping happens at boundaries.
- Retries/backoff remain in services, never in UI components.
