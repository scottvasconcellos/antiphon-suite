# @antiphon/hub

Antiphon Hub manager application package.

## Folder Structure

```text
src/
  domain/
    auth/
    __tests__/
  services/
    auth/
    __tests__/
  ui/
    components/
    __tests__/
```

## Architecture

This package follows a strict Layer 2 split:

- Domain: pure business logic (`src/domain`)
- Services: I/O and orchestration (`src/services`)
- UI: presentation components (`src/ui`)

See full architecture details in:
- [Layer 2 Auth Architecture](../../docs/architecture/layer2-auth.md)
