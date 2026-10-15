#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== IJA-WPMS repair/setup =="

if command -v nvm >/dev/null 2>&1; then
  nvm use --delete-prefix "$(node -v)" --silent || true
fi

# Remove nvm-incompatible project npm settings.
if [[ -f .npmrc ]]; then
  sed -i '/^[[:space:]]*prefix[[:space:]]*=.*/d;/^[[:space:]]*globalconfig[[:space:]]*=.*/d' .npmrc
fi
printf 'node-linker=isolated\n' > .npmrc

# Install dependencies. This project no longer runs Husky during install.
pnpm install --no-frozen-lockfile

# PostgreSQL 18 uses /var/lib/postgresql as the volume mount.
docker compose down -v
docker compose up -d postgres

# Wait for DB health.
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U ija -d ija_wpms >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

pnpm db:generate
pnpm db:migrate
pnpm db:seed

printf '\nReady. Start with: pnpm dev\n'
