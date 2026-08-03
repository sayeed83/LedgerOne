#!/usr/bin/env bash
# Composes the per-module Prisma schema files and applies migrations against
# the database in DATABASE_URL (06_DATABASE_STANDARDS.md). Uses `migrate dev`
# locally so new migrations are generated from schema changes; CI/production
# should call `prisma migrate deploy` directly against the composed schema.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCHEMA="$ROOT_DIR/apps/api/src/database/generated/schema.prisma"

tsx "$ROOT_DIR/scripts/db/compose-schema.ts"

cd "$ROOT_DIR/apps/api"
npx prisma migrate dev --schema "$SCHEMA" "$@"
