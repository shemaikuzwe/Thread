FROM node:20-alpine
WORKDIR /repo
RUN corepack enable

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api ./apps/api
COPY packages/db ./packages/db

RUN pnpm install --no-frozen-lockfile

WORKDIR /repo/apps/api
RUN pnpm run build

CMD ["pnpm", "start"]
