# Technology Baseline

This repository uses the modern stack recommended for IJA-WPMS.

As of 2026-09-05, verification was made against official sources:

- Next.js 16.3.x active LTS security line: https://nextjs.org/blog
- React latest documented version 19.2: https://react.dev/versions
- PostgreSQL 18.6 current supported minor: https://www.postgresql.org/docs/release/18.6/
- Prisma 8 is the current major; Prisma 7 remains supported. This project targets the Prisma 8 production line: https://www.prisma.io/docs
- Tailwind CSS v4: https://tailwindcss.com/docs

Dependencies are intentionally expressed with ranges for security patch updates; lock the resolved versions with `pnpm install`/`pnpm-lock.yaml` for each deployment.
