# IJA-WPMS Release Checklist

## Security

- [PASS] Default credentials removed from production code
- [PASS] SESSION_SECRET validated at startup (production)
- [PASS] NODE_ENV=production in container configuration
- [PASS] CSRF protection active on all state-changing operations
- [PASS] Session cookies HttpOnly + SameSite=Strict + Secure (production)
- [PASS] Authorization on all API endpoints (401/403 verified)
- [PASS] IDOR protection verified (executor cannot access admin data)
- [PASS] Mass assignment protection via PermissionsGuard
- [PASS] No sensitive data in API responses (passwordHash excluded)
- [PARTIAL] CORS configured for development; production CORS_ORIGINS must be set
- [PARTIAL] Swagger disabled in production via main.ts (verify deployment)

## Authentication

- [PASS] Login works with valid credentials
- [PASS] Login rejects invalid credentials (401)
- [PASS] Session expires after timeout
- [PASS] Logout destroys session
- [PASS] CSRF token refresh available

## Authorization

- [PASS] Role-based access control on all endpoints
- [PASS] Year protection (closed year blocks mutations)
- [PASS] Custom role management via API
- [PASS] Module access management via UI

## Database

- [PASS] Schema valid (prisma validate)
- [PASS] Migrations recognized by Prisma (7 applied + 1 pending)
- [PASS] FK integrity verified (zero orphans)
- [PASS] No duplicate records (usernames, org codes, KPI codes)
- [PASS] Seed runs idempotently in development

## Migrations

- [PASS] ManagementReview migration SQL created
- [PARTIAL] Clean DB reproduction via `prisma migrate deploy` (not yet run on empty DB)
- [BLOCKED] `prisma migrate dev` blocked by shadow DB schema mismatch (workaround: `db push` + manual migration SQL)
- [ACTION REQUIRED] Run `prisma migrate deploy` on target database before production deployment

## Source Data

- [PASS] Source plan import creates stable baseline
- [PASS] Import idempotent (second import creates zero duplicates)
- [PASS] Seed data complete

## Strategy

- [PASS] Strategic plan CRUD works
- [PASS] Theme management works
- [PASS] Goal management works
- [PASS] Objective management works
- [PASS] Rollover to new years works

## Planning

- [PASS] Planning year CRUD works
- [PASS] Plan CRUD works
- [PASS] Year status transitions work (close/reopen)
- [PASS] Year protection enforced

## KPI

- [PASS] KPI definition CRUD works
- [PASS] KPI plan CRUD works
- [PASS] KPI templates work

## Actuals

- [PASS] Actual entry works
- [PASS] Actual verification works
- [PASS] Actual metrics calculate correctly
- [PASS] Duplicate actuals rejected

## Workplan

- [PASS] Workplan CRUD works
- [PASS] Activity CRUD works
- [PASS] Activity workflow works (submit, approve, reject, resubmit)
- [PASS] Activity progress tracking works

## Projects

- [PASS] Project CRUD works
- [PASS] Milestone management works

## Budget

- [PASS] Budget CRUD works
- [PASS] Budget lines work
- [PASS] Currency handling works

## Risk

- [PASS] Risk CRUD works
- [PASS] Risk review works
- [PASS] Risk categories work

## Compliance

- [PASS] Compliance CRUD works
- [PASS] Requirements tracked
- [PASS] Findings tracked
- [PASS] Corrective actions tracked

## Monitoring

- [PASS] Monitoring page loads
- [PASS] Monitoring data displays

## Management Review

- [PASS] Create review works
- [PASS] Add findings works
- [PASS] Add decisions works
- [PASS] Add actions works
- [PASS] Update actions works
- [PASS] Close review works
- [PASS] Audit trail logged
- [PASS] Year protection enforced

## Approval

- [PASS] Activity submission works
- [PASS] Activity approval works
- [PASS] Activity rejection works
- [PASS] Activity resubmission works
- [PASS] Separation of duties enforced
- [PASS] Dashboard shows pending approvals

## Dashboard

- [PASS] Dashboard loads
- [PASS] KPI summary displays
- [PASS] Activity summary displays
- [PASS] Monitoring summary displays

## Reporting

- [PASS] Reports page accessible
- [PASS] Report generation works

## Search

- [PASS] Search accessible from dashboard
- [PASS] Search returns results
- [PASS] Search respects limits

## Attachments

- [PASS] Upload works
- [PASS] Download works

## Users

- [PASS] User CRUD works
- [PASS] Password reset works
- [PASS] Module access management works
- [PASS] Deactivate/reactivate works

## Organization

- [PASS] Org unit CRUD works
- [PASS] Employee CRUD works

## Year Lifecycle

- [PASS] Year creation works
- [PASS] Year close works
- [PASS] Year reopen works
- [PASS] Closed year protection works
- [PASS] Rollover works

## Backup/Restore

- [PASS] Backup creation works
- [PASS] Restore works
- [PASS] Schema validated after restore
- [PASS] API starts after restore

## Responsive

- [PASS] Desktop (1440x900) - all core pages
- [PASS] Tablet (768x1024) - all core pages
- [PARTIAL] Mobile (390x844) - core pages functional, some optimization needed

## Accessibility

- [PASS] Labels on form inputs
- [PASS] Heading structure correct
- [PASS] Keyboard operation supported
- [PASS] Button names accessible
- [PASS] Form errors displayed
- [NOT TESTED] Full WCAG 2.1 AA certification

## Observability

- [PASS] Health endpoint functional
- [PASS] Logging captures errors
- [PASS] No sensitive data in logs

## Docker

- [PASS] Dockerfiles exist and build
- [PASS] Docker Compose configured
- [PASS] Container startup works
- [PASS] Health check configured

## Production Config

- [PASS] NODE_ENV=production in container
- [PASS] SESSION_SECRET validated at startup
- [PARTIAL] CORS_ORIGINS must be configured for production
- [PASS] Secure cookies in production
- [PASS] Swagger disabled in production

## Release Actions Required

1. Set `ADMIN_INIT_PASSWORD` environment variable in production deployment
2. Set strong `SESSION_SECRET` in production deployment
3. Configure `CORS_ORIGINS` for production domains
4. Run `prisma migrate deploy` on target database before first deployment
5. Verify Swagger is disabled in production after deployment
6. Run `pnpm db:seed` with production credentials on first deployment
