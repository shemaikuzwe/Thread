FROM node:20-alpine AS base

# If you run into "glibc" errors, uncomment the line below.
# RUN apk add --no-cache libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Fetch packages first (optimizes caching)
RUN pnpm fetch
# Install dependencies from the virtual store
RUN pnpm install --offline --frozen-lockfile


FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# build the app
RUN pnpm run build

FROM base AS prod_deps
COPY package.json pnpm-lock.yaml ./
# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile

FROM base AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY  package.json ./

COPY --from=prod_deps /app/node_modules ./node_modules

COPY --from=build /app/build ./build

CMD ["npm", "start"]
