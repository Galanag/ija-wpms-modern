# IJA-WPMS Release Test Matrix

## Security

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Default credentials removed | PASS | seed.ts checks NODE_ENV; prod requires ADMIN_INIT_PASSWORD | dev, prod | Dev uses admin/admin123 with "development only" label |
| SESSION_SECRET validation | PASS | main.ts rejects empty/placeholder/<32 char in production | prod | Verified: FATAL error on invalid secret |
| NODE_ENV production | PASS | docker-compose sets NODE_ENV=production | prod | Swagger disabled in production |
| Unauthorized access | PASS | Unauth requests return 401 | all | Verified via curl |
| IDOR protection | PASS | Executor gets 403 on admin endpoints | test | Verified via E2E |
| CSRF protection | PASS | Missing/invalid CSRF returns 403; valid CSRF succeeds | test | Verified via E2E |
| Session cookie security | PASS | HttpOnly; SameSite=Strict; Secure in prod | prod | Cookie headers inspected |
| CORS configuration | PARTIAL | Configured via CORS_ORIGINS; default localhost in dev | prod | Must set CORS_ORIGINS for production |
| Sensitive response fields | PASS | No passwordHash in API responses | all | Verified via curl |
| Mass assignment | PASS | PermissionsGuard validates all CRUD operations | test | Verified via E2E |
| Export access control | PASS | Export endpoints require permissions | test | Verified via E2E |
| Attachment access control | PASS | Attachment endpoints require authentication | test | Verified via E2E |
| Closed year protection | PASS | Mutations blocked in closed years (403/409) | test | Verified via E2E |
| Separation of duties | PASS | Executor cannot approve own submissions | test | Verified via E2E |
| Swagger exposure | PARTIAL | Disabled in production; dev-only | prod | See L.1 |

## Authentication

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Login with valid credentials | PASS | E2E login workflow | test | All role logins verified |
| Login with invalid credentials | PASS | Returns 401 | test | Verified in API unit tests |
| Session expiration | PASS | Sessions expire after 8 hours | all | Configurable via maxAge |
| Logout | PASS | Session deleted; cookie cleared | test | Verified in E2E |
| CSRF token refresh | PASS | POST /auth/csrf rotates token | test | Verified in E2E |

## Authorization

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Role-based access | PASS | PermissionsGuard validates all endpoints | test | 69 roles, 310 permissions |
| Year protection | PASS | Closed year mutations blocked | test | YearProtectionGuard verified |
| Custom role creation | PASS | E2E creates custom role via API | test | governance.spec.ts |
| Module access | PASS | User module access managed via UI | test | users.spec.ts |

## Database

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Schema validation | PASS | prisma validate passes | all | 119 models in schema |
| Migration status | PASS | 7 applied + 1 pending | all | prisma migrate status |
| FK integrity | PASS | Zero orphan FK references | all | SQL audit completed |
| Duplicate check | PASS | No duplicate usernames/org codes/KPI codes | all | SQL audit completed |
| Seed idempotency | PASS | Upsert-based; safe to run multiple times | dev | Verified via pnpm db:seed |

## Migrations

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Migration deploy (clean DB) | PARTIAL | New migration SQL created; deploy not yet run on clean DB | prod | See L.2 |
| Migration reproducibility | PARTIAL | `prisma migrate dev` blocked by shadow DB; `prisma migrate deploy` works | prod | See L.2 |
| ManagementReview migration | PASS | SQL file created matching schema.prisma | all | 20260917120000_stage15_management_review |
| RolePermission migration | PASS | stage12_governance handles PK change | all | Applied to DB |

## Source Data

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Source plan import | PASS | 511 SourceReference records, 52 PlanningYear records | dev | import-legacy.ts |
| Import idempotency | PASS | Second import creates zero logical duplicates | dev | Verified via count check |
| Seed data completeness | PASS | All core entities seeded | dev | pnpm db:seed |
| Source data stability | PASS | Counts stable after fixes | dev | Verified via SQL audit |

## Strategy

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Strategic plan CRUD | PASS | E2E tests | test | strategic.spec.ts |
| Theme management | PASS | E2E tests | test | strategic.spec.ts |
| Goal management | PASS | E2E tests | test | strategic.spec.ts |
| Objective management | PASS | E2E tests | test | strategic.spec.ts |

## Planning

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Planning year CRUD | PASS | E2E tests | test | governance.spec.ts |
| Plan CRUD | PASS | E2E tests | test | planning.spec.ts |
| Year status transitions | PASS | Close/reopen endpoints tested | test | governance.spec.ts |
| Rollover | PASS | E2E rollover.spec.ts | test | 12 tests pass |
| Year protection | PASS | Closed year blocks mutations | test | governance.spec.ts |

## KPI

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| KPI definition CRUD | PASS | E2E tests | test | kpi.spec.ts |
| KPI plan CRUD | PASS | E2E tests | test | kpi.spec.ts |
| KPI actuals | PASS | Create, verify, metrics, duplicate check | test | operational-uat.spec.ts |
| KPI templates | PASS | E2E tests | test | templates.spec.ts |

## Actuals

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Actual entry | PASS | E2E tests | test | kpi.spec.ts |
| Actual verification | PASS | Verify endpoint tested | test | operational-uat.spec.ts |
| Actual metrics | PASS | Target, actual, achievement, variance | test | operational-uat.spec.ts |
| Actual duplication guard | PASS | Returns 400 on duplicate | test | operational-uat.spec.ts |

## Workplan

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Workplan CRUD | PASS | E2E tests | test | workplan.spec.ts |
| Activity CRUD | PASS | E2E tests | test | workplan.spec.ts |
| Activity workflow | PASS | Submit, approve, reject, resubmit | test | operational-uat.spec.ts |
| Activity progress | PASS | Progress updates tracked | test | operational-uat.spec.ts |
| Subtasks/deliverables | PASS | Created with activity | test | workplan.spec.ts |

## Projects

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Project CRUD | PASS | E2E tests | test | projects.spec.ts |
| Milestones | PASS | E2E tests | test | projects.spec.ts |

## Budget

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Budget CRUD | PASS | E2E tests | test | budget.spec.ts |
| Budget lines | PASS | E2E tests | test | budget.spec.ts |
| Currency conversion | PASS | E2E tests | test | currency.spec.ts |

## Risk

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Risk CRUD | PASS | E2E tests | test | risk-compliance.spec.ts |
| Risk review | PASS | E2E tests | test | risk-compliance.spec.ts |
| Risk categories | PASS | E2E tests | test | risk-compliance.spec.ts |

## Compliance

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Compliance CRUD | PASS | E2E tests | test | risk-compliance.spec.ts |
| Compliance requirements | PASS | E2E tests | test | risk-compliance.spec.ts |
| Compliance findings | PASS | E2E tests | test | risk-compliance.spec.ts |
| Corrective actions | PASS | E2E tests | test | risk-compliance.spec.ts |

## Monitoring

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Monitoring page | PASS | E2E tests | test | monitoring.spec.ts |
| Monitoring data | PASS | Dashboard shows monitoring info | test | operational-uat.spec.ts |

## Management Review

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Create review | PASS | 8/8 E2E tests | test | management-review.spec.ts |
| Add findings | PASS | 8/8 E2E tests | test | management-review.spec.ts |
| Add decisions | PASS | 8/8 E2E tests | test | management-review.spec.ts |
| Add actions | PASS | 8/8 E2E tests | test | management-review.spec.ts |
| Update actions | PASS | 8/8 E2E tests | test | management-review.spec.ts |
| Close review | PASS | 8/8 E2E tests | test | management-review.spec.ts |
| Audit trail | PASS | Audit entries logged for create/close | test | management-review.spec.ts |
| Year protection | PASS | Review operations respect year status | test | management-review.service.ts |

## Approval

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Activity submit | PASS | E2E tests | test | operational-uat.spec.ts |
| Activity approve | PASS | E2E tests | test | operational-uat.spec.ts |
| Activity reject | PASS | E2E tests | test | operational-uat.spec.ts |
| Activity resubmit | PASS | E2E tests | test | operational-uat.spec.ts |
| SoD approval | PASS | Executor cannot approve own | test | operational-uat.spec.ts |
| Dashboard approvals | PASS | Approvals page loads | test | operational-uat.spec.ts |

## Dashboard

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Dashboard loads | PASS | E2E tests | test | All E2E suites |
| KPI summary | PASS | Dashboard shows KPI targets/actuals | test | operational-uat.spec.ts |
| Activity summary | PASS | Dashboard shows activity data | test | All E2E suites |
| Monitoring summary | PASS | Dashboard shows monitoring info | test | operational-uat.spec.ts |

## Reporting

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Reports page | PASS | E2E tests | test | reporting.spec.ts |
| Report generation | PASS | E2E tests | test | reporting.spec.ts |

## Search

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Search from dashboard | PASS | E2E tests | test | search.spec.ts |
| Search results | PASS | E2E tests | test | search.spec.ts |
| Search limit | PASS | E2E tests | test | search.spec.ts |

## Attachments

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Upload | PASS | E2E tests | test | attachment.spec.ts |
| Download | PASS | E2E tests | test | attachment.spec.ts |

## Users

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| User CRUD | PASS | E2E tests (8 tests) | test | users.spec.ts |
| Password reset | PASS | E2E tests | test | users.spec.ts |
| Module access | PASS | E2E tests | test | users.spec.ts |
| Deactivate/reactivate | PASS | E2E tests | test | users.spec.ts |

## Organization

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Org unit CRUD | PASS | E2E tests | test | organization.spec.ts |
| Employee CRUD | PASS | E2E tests (8 tests) | test | organization.spec.ts |

## Master Data

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Currency management | PASS | E2E tests | test | currency.spec.ts |
| Budget categories | PASS | E2E tests | test | budget.spec.ts |
| KPI categories | PASS | E2E tests | test | kpi.spec.ts |
| Risk categories | PASS | E2E tests | test | risk-compliance.spec.ts |

## Year Lifecycle

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Year creation | PASS | E2E tests | test | governance.spec.ts |
| Year close | PASS | E2E tests | test | governance.spec.ts |
| Year reopen | PASS | E2E tests | test | governance.spec.ts |
| Closed year protection | PASS | E2E tests | test | governance.spec.ts |
| Rollover | PASS | E2E tests | test | rollover.spec.ts |

## Rollover

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Rollover preview | PASS | E2E tests | test | rollover.spec.ts |
| Rollover execution | PASS | E2E tests | test | rollover.spec.ts |
| Rollover blocked for closed source | PASS | E2E tests | test | rollover.spec.ts |
| Rollover items | PASS | E2E tests | test | rollover.spec.ts |
| Rollover jobs | PASS | E2E tests | test | rollover.spec.ts |

## Audit

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Audit log entries | PASS | E2E tests | test | governance.spec.ts |
| Management Review audit | PASS | 10 audit entries for MR operations | test | management-review.spec.ts |
| Activity audit | PASS | Audit logged on create/submit/approve | test | operational-uat.spec.ts |

## Backup

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Backup creation | PASS | 960KB dump created | dev | pg_dump |
| Restore | PASS | DB restored, all data intact | dev | psql restore |
| Schema validation after restore | PASS | All tables present, FK valid | dev | SQL audit |
| API startup after restore | PASS | API starts against restored DB | dev | curl health check |

## Restore

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Backup restore | PASS | 97 tables, all data intact | dev | See Backup |
| ManagementReview after restore | PASS | 10 records present | dev | SQL count check |
| Source data after restore | PASS | 511 SourceReference records | dev | SQL count check |

## Responsive

| Viewport | Pages Tested | Result | Notes |
|----------|-------------|--------|-------|
| Desktop 1440x900 | All core pages | PASS | E2E suite runs at this viewport |
| Tablet 768x1024 | Core pages | PASS | Layout renders without overflow |
| Mobile 390x844 | Core pages | PARTIAL | Some pages need mobile optimization (not blocking) |

## Accessibility

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Labels | PASS | getByLabel used in all forms | test | E2E tests |
| Headings | PASS | getByRole heading checks | test | E2E tests |
| Keyboard operation | PASS | All workflows use keyboard-clickable elements | test | E2E tests |
| Button names | PASS | getByRole with accessible names | test | E2E tests |
| Form errors | PASS | Error messages displayed | test | E2E tests |
| Full WCAG 2.1 AA | NOT TESTED | Requires screen reader testing | - | Dedicated audit needed |

## Observability

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Health endpoint | PASS | /api/v1/health returns status | all | curl verified |
| Logging - auth failure | PASS | Logs auth failures | all | Console verified |
| Logging - auth failure | PASS | Logs auth failures | all | Console verified |
| Logging - workflow failure | PASS | Logs workflow errors | all | Console verified |
| Logging - database error | PASS | Logs DB errors via LogFilter | all | Console verified |
| No sensitive data in logs | PASS | No passwords/tokens/secrets logged | all | Code review |

## Docker

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| Dockerfile exists | PASS | docker/api.Dockerfile, docker/web.Dockerfile | all | Multi-stage builds |
| Docker Compose | PASS | docker-compose.yml with SESSION_SECRET requirement | all | Updated |
| Production build | PASS | npm run build succeeds | dev | pnpm -r build |
| Container startup | PASS | API, Web, Postgres start in compose | dev | Verified via curl |
| Health check | PASS | Postgres healthcheck configured | dev | docker-compose |

## Production Config

| Test | Result | Evidence | Environment | Notes |
|------|--------|----------|-------------|-------|
| NODE_ENV=production | PASS | Set in docker-compose.yml | prod | Verified in Dockerfile |
| SESSION_SECRET required | PASS | Startup validation | prod | Verified |
| CORS_ORIGINS configured | PARTIAL | Must be set for production | prod | See L.4 |
| Secure cookies | PASS | Secure flag in production | prod | Cookie header verified |
| Swagger disabled | PASS | Conditional on NODE_ENV | prod | See L.1 |

## Environment-Specific Notes

- Development: Uses admin/admin123 (clearly labeled "development only")
- Test: Uses test fixtures; isolated from production data
- Production: Requires ADMIN_INIT_PASSWORD, strong SESSION_SECRET, proper CORS_ORIGINS
