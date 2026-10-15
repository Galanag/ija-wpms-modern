# Operations Runbook

## Start Application

### Local Development
```bash
cd ~/Desktop/dashboard/ija-wpms-modern
pnpm install
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Production
```bash
cd /app/ija-wpms
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:deploy
pnpm -r build
pnpm --filter @ija/api start:prod
pnpm --filter @ija/web start
```

## Stop Application
```bash
pnpm stop
# or
docker compose down
```

## Database Health
```bash
# Prisma check
pnpm db:validate

# Check migration status
pnpm db:migrate status

# Direct database query
PGPASSWORD=ija_dev_password psql -h localhost -p 5434 -U ijawpms -d ijawpms -c "SELECT 1;"

# Health endpoint
curl http://localhost:4000/health
```

## Migration Process
```bash
# Create migration from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate

# Deploy migrations (production)
pnpm db:deploy

# Check status
pnpm db:migrate status
```

## Seed / Import
```bash
# Seed development data
pnpm db:seed

# Import legacy data
pnpm legacy:inspect -- --file /path/to/legacy.db
pnpm legacy:import -- --file /path/to/legacy.db
```

## Backup
```bash
# PostgreSQL backup
PGPASSWORD=ija_dev_password pg_dump -h localhost -p 5434 -U ijawpms -d ijawpms -F c -f /backup/ija_wpms_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
PGPASSWORD=ija_dev_password pg_restore -h localhost -p 5434 -U ijawpms -d ijawpms --dry-run /backup/backup.dump
```

## Restore
```bash
# Stop application first
pnpm stop

# Restore backup
PGPASSWORD=ija_dev_password pg_restore -h localhost -p 5434 -U ijawpms -d ijawpms /backup/backup.dump

# Run migrations after restore
pnpm db:migrate

# Restart
pnpm dev
```

## Logs
```bash
# API logs
pnpm --filter @ija/api logs

# Web logs
pnpm --filter @ija/web logs

# Docker logs
docker compose logs -f api
docker compose logs -f web

# Health check logs
curl http://localhost:4000/health
```

## Health Checks
```bash
# Application health
curl http://localhost:4000/health

# API endpoints
curl http://localhost:4000/api/v1/auth/me
curl http://localhost:4000/api/v1/dashboard

# Web access
curl http://localhost:3000
```

## Troubleshooting

### Database connection fails
- Check Docker postgres container is running: `docker compose ps postgres`
- Check DATABASE_URL in .env
- Verify PostgreSQL is accepting connections

### API returns 401/403
- Check session cookie is present
- Verify CSRF token is included in requests
- Check user role and permissions

### Page not loading
- Check web dev server is running on port 3001
- Verify API is accessible at http://localhost:4000/api/v1
- Check browser console for errors

### Migration errors
- Check migration status: `pnpm db:migrate status`
- Review migration files in `prisma/migrations/`
- Never run `db:push` in production

## User Administration

### Create user (admin)
```bash
curl -X POST http://localhost:4000/api/v1/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: ija_session=..." \
  -H "X-CSRF-Token: ..." \
  -d '{"username":"newuser","password":"secure123","fullName":"New User","roleId":8,"primaryOrgUnitId":5}'
```

### Deactivate user
```bash
curl -X DELETE http://localhost:4000/api/v1/admin/users/USER_ID \
  -H "Cookie: ija_session=..." \
  -H "X-CSRF-Token: ..."
```

## Year Close/Reopen
```bash
# Close a planning year (admin)
curl -X POST http://localhost:4000/api/v1/planning/years/YEAR_ID/close \
  -H "Cookie: ija_session=..." \
  -H "X-CSRF-Token: ..."

# Reopen a planning year (admin)
curl -X POST http://localhost:4000/api/v1/planning/years/YEAR_ID/reopen \
  -H "Cookie: ija_session=..." \
  -H "X-CSRF-Token: ..."
```

## Rollover
```bash
# Execute rollover job (admin)
curl -X POST http://localhost:4000/api/v1/rollover/execute \
  -H "Cookie: ija_session=..." \
  -H "X-CSRF-Token: ..." \
  -d '{"sourceYearId":10,"targetYearId":11}'
```