.PHONY: install dev build test db-up db-migrate db-seed studio e2e
install:
	corepack enable && pnpm install

db-up:
	docker compose up -d postgres

db-migrate:
	pnpm db:migrate

db-seed:
	pnpm db:seed

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

e2e:
	pnpm test:e2e

studio:
	pnpm db:studio
