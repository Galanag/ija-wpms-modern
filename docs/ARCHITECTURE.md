# IJA-WPMS Architecture

## Monorepo

```text
apps/web    Next.js frontend
apps/api    NestJS backend
packages/ui shared UI primitives
packages/types shared TypeScript domain types
packages/validation shared Zod schemas
prisma/     PostgreSQL data model/migrations/seed
scripts/    legacy inspection/import tooling
tests/      shared regression scenarios
docs/       architecture/UAT/deployment guidance
```

## Business backbone

```text
Company
  └─ Division
      └─ Sector
          └─ Directorate
              └─ Department
                  └─ Branch
                      └─ Team
                          └─ Employee
```

Every scoped business entity either owns an OrganizationUnit reference or derives its scope through an explicit parent relation.

## Domain flow

```text
Strategy
  → Goals/Objectives
  → Annual Plan / Activities / KPIs
  → Budget Request / Approval
  → Budget / Budget Lines
  → Finance Transactions
  → Execution / KPI Actuals
  → Monitoring / Evaluation
  → Dashboard / Reports
  → Management Actions
```

## CRUD philosophy

Every operational resource has:

- list endpoint
- detail endpoint
- create endpoint
- update endpoint
- archive/delete endpoint where safe
- filter/search/pagination
- permission check
- organization scope check
- audit event

The frontend consumes this contract through TanStack Query mutations.
