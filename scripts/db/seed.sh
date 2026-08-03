#!/usr/bin/env bash
# Runs platform + (non-production) development seed data via
# scripts/db/run-seeds.ts (06_DATABASE_STANDARDS.md).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

tsx "$ROOT_DIR/scripts/db/run-seeds.ts"
