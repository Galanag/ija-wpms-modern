# Test 
cd ~/Desktop/dashboard/ija-wpms-modern && \
pnpm db:validate && \
pnpm db:generate && \
pnpm prisma migrate status && \
pnpm typecheck && \
pnpm build

# Terminal 1 — API
cd ~/Desktop/dashboard/ija-wpms-modern && pnpm --filter @ija/api dev

# Terminal 2 — Web
fuser -k 3001/tcp
cd ~/Desktop/dashboard/ija-wpms-modern/apps/web && PORT=3001 pnpm dev

## Then open:

http://localhost:3001

