# Thread (Monorepo)

This repo is now organized as a Turborepo monorepo:

- `apps/web`: React Router frontend
- `apps/api`: NestJS HTTP API (Drizzle ORM) for auth, users, chats, and reads
- `apps/ws-server`: Go WebSocket realtime server (WS writes, presence, Redis fanout)
- `apps/chat-service`: NestJS gRPC service for chat workflows
- `apps/notification`: NestJS RabbitMQ microservice for push notifications
- `packages/db`: Drizzle schema/client/migrations

## Dev Commands

```bash
pnpm install
pnpm dev
```

## Lint/Format

```bash
pnpm lint
pnpm fmt
```

Formatting/linting uses `oxfmt` and `oxlint`.
