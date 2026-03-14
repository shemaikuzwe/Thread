FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat \
  && corepack enable \
  && corepack prepare pnpm@9.0.0 --activate

FROM base AS prepare
WORKDIR /app
COPY . .
RUN pnpm dlx turbo@2.5.6 prune chat-service --docker

FROM base AS deps
WORKDIR /app
COPY --from=prepare /app/out/json/ ./
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=prepare /app/out/full/ ./
RUN pnpm --filter api build

FROM base AS prod-deps
WORKDIR /app
COPY --from=prepare /app/out/json/ ./
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
EXPOSE 8000
CMD ["node", "dist/main.js"]
