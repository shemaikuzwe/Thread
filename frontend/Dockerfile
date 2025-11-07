FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS development-dependencies-env
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i
COPY . .

FROM base AS production-dependencies-env
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm i --prod

FROM base AS build-env
WORKDIR /app
COPY --from=development-dependencies-env /app  ./
RUN pnpm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

COPY package.json pnpm-lock.yaml ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build

CMD ["pnpm", "run", "start"]
