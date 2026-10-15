# SQLite → PostgreSQL Migration

## Principle

The current PHP/SQLite application is a business reference, not the new runtime architecture.

## Steps

1. Freeze a copy of the legacy SQLite DB.
2. Run `pnpm legacy:inspect -- --file ...`.
3. Review row counts and warnings.
4. Run the importer against a development PostgreSQL database.
5. Reconcile organization hierarchy first.
6. Reconcile users/roles/module access.
7. Reconcile planning years and periods.
8. Reconcile strategy/goals/objectives/activities/KPIs.
9. Reconcile budget/finance relationships.
10. Reconcile employee plans/evaluations.
11. Reconcile remaining modules.
12. Compare counts and financial totals.
13. Run UAT and security tests.

The importer must be idempotent on stable legacy identifiers and must never destroy an existing PostgreSQL environment.
