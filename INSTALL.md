# IJA-WPMS local installation

## Requirements
- Node.js 24 LTS (nvm recommended)
- pnpm 10
- Docker + Docker Compose

## Fresh local setup

```bash
cd ~/Desktop/dashboard/ija-wpms-modern
nvm use --delete-prefix v24.20.0 --silent

# Project .npmrc must not contain prefix/globalconfig.
printf 'node-linker=isolated\n' > .npmrc

pnpm install

docker compose down -v
docker compose up -d postgres
docker compose ps

pnpm db:generate
pnpm db:validate
pnpm db:migrate
pnpm db:seed
pnpm typecheck
pnpm dev
```

## Endpoints
- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/docs
- PostgreSQL host port: 5434

## Development database
The Docker database is PostgreSQL 18. The compose file mounts the volume at `/var/lib/postgresql`, which is the expected layout for PostgreSQL 18 images.

## Development database
The Docker database is PostgreSQL 18. The compose file mounts the volume at `/var/lib/postgresql`, which is the expected layout for PostgreSQL 18 images.

## Default development login (development only)
- Username: `admin`
- Password: `admin123`

CHANGE THIS IMMEDIATELY IN PRODUCTION. Production deployments require setting `ADMIN_INIT_PASSWORD` environment variable before starting the API. The seed will refuse to create a default admin in production mode without this variable.

Production requirements:
- `SESSION_SECRET`: strong random secret (>=32 chars), set before startup
- `NODE_ENV=production`: set in deployment environment
- `ADMIN_INIT_PASSWORD`: initial admin password (>=8 chars), set before startup

## Important
Prisma is pinned to 6.19.0 in this starter because the application currently uses the Prisma 6 client import style (`@prisma/client`) and schema datasource URL style. Prisma 7 introduced breaking configuration/client-generation changes; migrate the application to Prisma 7+ only as a deliberate separate upgrade.
