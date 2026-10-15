# Deployment

## Prerequisites

- Node.js >= 24.0.0
- pnpm 10.15.0 (use `corepack enable` to activate)
- PostgreSQL 16+ (local or Docker)
- Docker and Docker Compose (for containerized deployment)

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://ija:ija_dev_password@localhost:5434/ija_wpms?schema=public

# API
NODE_ENV=development
PORT=4000
SESSION_SECRET=<random-secret-min-32-chars>
CORS_ORIGINS=http://localhost:3000

# Web
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Storage
STORAGE_ROOT=./storage/uploads
```

### Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://ija:<secure-password>@<db-host>:5432/ija_wpms?schema=public
PORT=4000
SESSION_SECRET=<cryptographically-random-64-char-secret>
CORS_ORIGINS=https://<your-domain>
WEB_URL=https://<your-domain>
STORAGE_ROOT=/app/storage/uploads
```

## Local Development Startup

```bash
# 1. Install dependencies
corepack enable
pnpm install

# 2. Start PostgreSQL (Docker)
docker compose up -d postgres

# 3. Wait for PostgreSQL to be ready (pg_isready)
docker compose ps postgres

# 4. Generate Prisma Client
pnpm db:generate

# 5. Run database migrations
pnpm db:migrate

# 6. Seed development data
pnpm db:seed

# 7. Start both web and API (concurrently)
pnpm dev
```

Or start services individually:

```bash
# Terminal 1: API only
pnpm dev:api

# Terminal 2: Web only
pnpm dev:web
```

## Health Checks

- API health: `GET http://localhost:4000/api/v1/health`
- Web health: `GET http://localhost:3000` (returns HTML)
- API docs (Swagger): `http://localhost:4000/docs`

## Docker Deployment

```bash
# Build and start all services
docker compose up --build

# View logs
docker compose logs -f api
docker compose logs -f web

# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

The `docker-compose.yml` defines three services:
- `postgres`: PostgreSQL 18.6-alpine on port 5434 (mapped to host port 5434)
- `api`: NestJS API on port 4000, depends on `postgres:service_healthy`
- `web`: Next.js frontend on port 3000, depends on `api`

## Database Migration

```bash
# Generate a new migration (development)
pnpm db:migrate -- --name migration_name

# Apply pending migrations (production)
pnpm db:deploy

# Format schema
pnpm db:format

# Validate schema
pnpm db:validate

# Open Prisma Studio
pnpm db:studio
```

## Build for Production

```bash
pnpm build
```

This generates Prisma Client and builds all packages/apps.

## Run Production

```bash
# After building
pnpm --filter @ija/api start:prod
pnpm --filter @ija/web start
```

## E2E Tests

```bash
# Requires running services on ports 3001 (web) and 4000 (API)
pnpm test:e2e
```

The Playwright config (`playwright.config.ts`) starts:
- API: `pnpm --filter @ija/api start:dev` (health: `http://localhost:4000/api/v1/health`)
- Web: `pnpm --filter @ija/web dev` (health: `http://localhost:3001`)

## Make Targets

```bash
make install   # corepack enable && pnpm install
make db-up     # docker compose up -d postgres
make db-migrate # pnpm db:migrate
make db-seed   # pnpm db:seed
make dev       # pnpm dev (both web + API)
make e2e       # pnpm test:e2e
make studio    # pnpm db:studio
```

## Troubleshooting

- **Port 5434 already in use**: Change the mapping in `docker-compose.yml` or stop the conflicting PostgreSQL instance.
- **Prisma migration fails**: Ensure `DATABASE_URL` matches your running PostgreSQL instance and the database exists.
- **Session/CSRF errors**: Ensure both web and API share the same domain/subdomain in production, or configure CORS and cookies accordingly.
- **Storage not writable**: Ensure `STORAGE_ROOT` directory exists and is writable by the process.
