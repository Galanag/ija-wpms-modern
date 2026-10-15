# Prisma

Run `pnpm db:generate` after changing `schema.prisma`.
Run `pnpm db:migrate` for local development and commit generated migration directories.
Run `pnpm db:deploy` in deployment environments.
Never edit production data directly to perform ordinary business CRUD; use the application.
