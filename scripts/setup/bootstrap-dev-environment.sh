#!/usr/bin/env bash
# Bootstraps a local LedgerOne development environment: installs workspace
# dependencies, provisions a local .env, starts MySQL/Redis/MinIO via Docker
# Compose, and applies Prisma migrations.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Installing workspace dependencies"
npm install

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
else
  echo "==> .env already exists, skipping"
fi

echo "==> Starting MySQL, Redis, and MinIO (docker/docker-compose.dev.yml)"
docker compose -f docker/docker-compose.dev.yml up -d

echo "==> Waiting for MySQL to become healthy"
until [ "$(docker compose -f docker/docker-compose.dev.yml ps -q mysql | xargs docker inspect -f '{{.State.Health.Status}}')" = "healthy" ]; do
  sleep 2
done

echo "==> Applying database migrations"
bash "$ROOT_DIR/scripts/db/migrate.sh"

echo "==> Development environment ready."
echo "    Run 'npm run dev:api' and 'npm run dev:web' in separate terminals to start the apps."
