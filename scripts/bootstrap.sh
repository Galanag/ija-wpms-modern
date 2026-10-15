#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
command -v node >/dev/null || { echo 'Node.js 24+ is required'; exit 1; }
command -v pnpm >/dev/null || { echo 'pnpm 10+ is required'; exit 1; }
if ! command -v docker >/dev/null; then echo 'Docker is recommended. Continuing without Docker.'; fi
[ -f .env ] || cp .env.example .env
corepack enable
pnpm install
if command -v docker >/dev/null; then docker compose up -d postgres; fi
pnpm db:generate
# Creates the first migration interactively if none exists.
if [ ! -d prisma/migrations ] || [ -z "$(find prisma/migrations -mindepth 1 -maxdepth 1 -type d 2>/dev/null)" ]; then
  pnpm db:migrate -- --name init
else
  pnpm db:migrate
fi
pnpm db:seed
printf '\nIJA-WPMS is provisioned. Run: pnpm dev\nWeb: http://localhost:3000\nAPI: http://localhost:4000/api/v1\nSwagger: http://localhost:4000/docs\n'
