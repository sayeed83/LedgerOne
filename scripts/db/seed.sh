#!/usr/bin/env bash
# Runs platform + (non-production) development seed data via
# scripts/db/run-seeds.ts (06_DATABASE_STANDARDS.md).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/.env"
set +a

npx tsx "$ROOT_DIR/scripts/db/run-seeds.ts"
