FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY prisma prisma
RUN corepack enable && pnpm install --no-frozen-lockfile --include=dev
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY . .
RUN corepack enable && pnpm db:generate && pnpm --filter @ija/api build
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/prisma ./prisma
RUN mkdir -p /app/storage/uploads
EXPOSE 4000
CMD ["node","apps/api/dist/main.js"]
