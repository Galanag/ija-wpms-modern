# IJA-WPMS Modern Full-Stack Platform

A new modular implementation of the IJA Developer Planning, Management, Performance, Budget, Finance, HR, Risk, Compliance, Tourism, Asset, Property, Project and Reporting platform.

## Stack

- Next.js 16.3.x / React 19 / TypeScript
- Tailwind CSS 4 + shadcn/ui-style primitives
- TanStack Query + TanStack Table
- React Hook Form + Zod
- NestJS + Fastify + REST/OpenAPI
- PostgreSQL 18+
- Prisma ORM 7 stable line (upgrade path documented)
- HttpOnly cookie session + CSRF token
- Vitest + Playwright
- pnpm
- Docker Compose + optional reverse proxy

Next.js 16.3.3 is the Active LTS security target as of September 2026; React 19.2 is the current React major/minor line; PostgreSQL 18.6 is the current PostgreSQL 18 minor release. See docs/TECHNOLOGY.md for references.

## 1. Prerequisites

Install:

- Node.js 24 LTS or newer compatible Node 24 release
- pnpm 10+
- PostgreSQL 18+
- Git
- Docker Desktop / Docker Engine (recommended)

Verify:

```bash
node -v
pnpm -v
psql --version
```

## 2. Fastest setup with Docker PostgreSQL

```bash
cp .env.example .env
pnpm install
docker compose -f docker-compose.yml up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open:

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/docs

Default seed account (development only):

- username: `admin`
- password: `admin123`

CHANGE THIS IMMEDIATELY IN PRODUCTION. Production deployments require setting `ADMIN_INIT_PASSWORD` environment variable before starting the API. The seed will refuse to create a default admin in production mode without this variable.

Production requirements:
- `SESSION_SECRET`: strong random secret (>=32 chars), set before startup
- `NODE_ENV=production`: set in deployment environment
- `ADMIN_INIT_PASSWORD`: initial admin password (>=8 chars), set before startup

## 3. Production-ish local stack

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm build
pnpm --filter @ija/api start:prod
pnpm --filter @ija/web start
```

## 4. Database commands

```bash
pnpm db:validate
pnpm db:format
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## 5. Legacy SQLite inspection/import

The current project ZIP is preserved as the business/reference source. Copy the old SQLite database to `legacy/` and run:

```bash
pnpm legacy:inspect -- --file /absolute/path/to/data.db
pnpm legacy:import -- --file /absolute/path/to/data.db
```

The importer is intentionally separated from the runtime API. It normalizes legacy records into the new PostgreSQL schema and records import warnings instead of silently discarding data.

## 6. Testing

```bash
# API unit tests
pnpm --filter @ija/api test

# Web unit tests
pnpm --filter @ija/web test

# All tests
pnpm -r test

# E2E tests
pnpm test:e2e

# Typecheck
pnpm typecheck

Run the API independently:

```bash
pnpm dev:api
```

Run the web independently:

```bash
pnpm dev:web
```

## 7. Architecture

See:

- docs/ARCHITECTURE.md
- docs/MIGRATION.md
- docs/CRUD_CONTRACT.md
- docs/AUTHORIZATION.md
- docs/GLOBAL_FILTERS.md
- docs/ATTACHMENTS.md
- docs/UAT.md
- docs/TECHNOLOGY.md

## 8. Core architectural rule

The system treats organization as the access backbone:

Company → Division → Sector → Directorate → Department → Branch → Team → Employee

and deliberately separates:

- Role
- Module access
- Organization scope
- Approval authority

See the supplied IJA-WPMS business documentation for the full business model.

## 9. Data editing rule

Operational business data is created and changed through the running application UI. Database/seed scripts are for initial provisioning, migrations and controlled legacy import only.

Historical/audit records are protected through revision/archive workflows rather than destructive edits.
