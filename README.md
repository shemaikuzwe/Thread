# Thread (Monorepo)

This repo is now organized as a Turborepo monorepo:

- `apps/web`: React Router frontend
- `apps/api`: NestJS HTTP API (Drizzle ORM) for auth, users, chats, and reads
- `apps/chat-server`: Go WebSocket realtime server (WS writes, presence, Redis fanout)
- `packages/db`: Drizzle schema/client/migrations

## Dev Commands

```bash
pnpm install
pnpm dev
```

## Lint/Format

```bash
pnpm lint
pnpm fmt:check
```

Formatting/linting uses `oxfmt` and `oxlint`.
