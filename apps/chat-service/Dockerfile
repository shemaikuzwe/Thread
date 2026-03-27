ARG NODE_VERSION=22
ARG PNPM_VERSION=10.23.0
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS prepare
RUN  npm install turbo --global
WORKDIR /app
COPY . .
RUN turbo prune chat-service --docker

FROM base AS deps
WORKDIR /app
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/out/json/.npmrc ./.npmrc
RUN apk add --no-cache openssl libc6-compat
RUN corepack enable \
    && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app .
COPY --from=prepare /app/out/full/ .
RUN corepack enable \
    && corepack prepare pnpm@${PNPM_VERSION} --activate

ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ARG TURBO_TOKEN
ENV TURBO_TOKEN=$TURBO_TOKEN

RUN pnpm build 
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter=chat-service deploy --legacy --prod prod

FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0
COPY --from=builder --chown=nodejs:nodejs /app/apps/chat-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/chat-service/chat.proto ./chat.proto
COPY --from=builder --chown=nodejs:nodejs /app/prod/node_modules ./node_modules
USER nodejs
EXPOSE 4000

CMD ["node", "dist/main.js"]
