# Legacy Engine Quarantine

These music-engine domain and service files are frozen by constitutional policy.

## Frozen paths (control-plane.scope.json)

- `domain/hubMusicOrchestrator.ts`
- `domain/minimalRealMusicIntelligenceEngine.ts`
- `domain/musicEngineContracts.ts`
- `domain/musicEngineRegistry.ts`
- `domain/musicIntelligenceEngine.ts`
- `domain/musicTelemetryContracts.ts`
- `domain/uiMusicProjectionAdapter.ts`
- `domain/ruleBasedMusicIntelligenceEngine.ts`
- `services/musicTelemetryDto.ts`

## Policy

- Excluded from Layer-1 control-plane runtime paths.
- Excluded from control-plane smoke verification paths.
- Not part of entitlement/install/update/offline/launch authority.
- Active control-plane modules (hubEngine, installUpdateAuthority, etc.) must not import these files.

Do not extend or re-couple these files into active control-plane modules.
