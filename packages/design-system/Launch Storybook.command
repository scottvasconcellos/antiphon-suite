#!/bin/bash
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
pnpm storybook &
sleep 4
open "http://localhost:6006"
