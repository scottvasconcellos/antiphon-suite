# Layer 4 - UI Composition Rules

## UI Boundary
- UI consumes view models only.
- UI emits intents/actions; no business rules in components.
- Token usage must come from `ANTIPHON_COLOR_TYPE_STYLE_GUIDE/*.json` projections.

## Hub Surface Areas
- `Shell`: navigation and global layout.
- `AuthSurface`: sign-in and trust-state presentation.
- `LibrarySurface`: entitlement list, install/update controls.
- `ActivitySurface`: transaction history stream.

## UI State Flow
- Authority responses -> service DTO -> domain projection -> UI view model.
- User intent -> UI action -> service command -> domain event -> UI refresh.
