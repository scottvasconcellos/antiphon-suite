#!/bin/bash
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
pnpm --filter @antiphon/figma-bundle-generator dev &
sleep 2
open "http://localhost:5173"
