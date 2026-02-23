# Agentic Coding Guidelines (AGENTS.md)

This repository is a monorepo comprising a TypeScript backend (NestJS), a React frontend (Next JS), and a Go-based chat server. This guide provides instructions for agentic coding assistants to ensure consistency and quality.

## 🛠 Commands & Operations

### Monorepo (Root)
- **Build All:** `pnpm build` (uses Turbo to orchestrate builds)
- **Lint All:** `pnpm lint` (runs `oxlint` across all packages)
- **Format All:** `pnpm fmt` (runs `oxfmt` across all packages)
- **Typecheck All:** `pnpm typecheck` (runs `tsc` across all packages)

### App-Specific Commands
- **API (NestJS):** `pnpm --filter api [dev|build|lint|fmt|typecheck]`
- **Web (Next Js):** `pnpm --filter web [dev|build|lint|fmt|typecheck]`
- **Chat Server (Go):** 
  - Run: `go run main.go` (in `apps/chat-server`)
  - Build: `go build -o thread`
- **Database (Drizzle):** 
  - Generate Migrations: `pnpm --filter @thread/db db:generate`
  - Apply Migrations: `pnpm --filter @thread/db db:migrate`

### Verification Strategy
Currently, automated tests are not explicitly configured. Use `pnpm typecheck` as the primary static verification tool. Always verify logic changes by running the relevant service and checking for runtime errors.

---

## 🎨 Code Style & Conventions

### General Principles
- **Simplicity First:** Favor readable, straightforward code over complex abstractions. Avoid over-engineering.
- **Understandability:** Write code that any agent or human can grasp in seconds.
- **Kebab-Case Files:** All file and folder names must be `kebab-case` (e.g., `user-profile.tsx`, `auth.service.ts`).
- **PascalCase Components:** React components and NestJS classes should use `PascalCase`.
- **camelCase Logic:** Functions, hooks, and variables should use `camelCase`.

### TypeScript (Web & API)
- **Formatting:** Managed by `oxfmt`. Preserve import sorting (side-effects > built-in > external > internal > relative).
- **Linting:** Managed by `oxlint`. Address all warnings before committing.
- **Explicit Types:** Avoid `any` at all costs. Use `interface` for objects and `type` for unions/aliases.
- **Path Aliases:** Use `@/` for `apps/web/src` and `@thread/db` for database access.

### React (Web)
- **Framework:** React Router v7. Route definitions are in `apps/web/src/routes.ts`.
- **Styling:** Tailwind CSS with `cn()` utility from `@/lib/utils` for conditional classes.
- **Components:** UI primitives reside in `src/components/ui` (Radix UI + Shadcn pattern).
- **Data Fetching:** TanStack Query (`@tanstack/react-query`) for server state management.
- **Forms:** React Hook Form + Zod for validation.

### NestJS (API)
- **Architecture:** Controller -> Service -> Repository (using Drizzle).
- **Validation:** Use `class-validator` and `ValidationPipe` in DTOs.
- **Response Shape:** Return standard JSON objects; avoid nested "data" wrappers unless required by the framework.

### Go (Chat Server)
- **Framework:** Gin Gonic for HTTP and WebSockets.
- **Internal Packages:** Business logic should be in `internal/`, utility functions in `utils/`.
- **Error Handling:** Explicitly check every error: `if err != nil { ... }`.
- **Concurrency:** Use channels and goroutines sparingly and only when necessary for performance or asynchronous tasks.

---

## 🗄 Database Management

The database is managed via Drizzle ORM in `packages/db`.
- **Schema:** Defined in `packages/db/src/schema.ts` (or files imported by it).
- **Migration Flow:** 
  1. Modify schema in `packages/db/src`.
  2. Run `pnpm --filter @thread/db db:generate`.
  3. Review the generated SQL in `packages/db/drizzle/`.
  4. Apply with `pnpm --filter @thread/db db:migrate`.

---

## 🚨 Error Handling & Security
- **Backend:** Use NestJS Exception Filters or Gin's error handling.
- **Frontend:** Implement Error Boundaries and handle API errors in UI components using `sonner` for notifications.
- **Secrets:** NEVER commit `.env` files. Access variables via `process.env` (TS) or `os.Getenv` (Go).
- **CORS:** Configured in `main.ts` (API) and `main.go` (Chat) using `CLIENT_APP_URL`.

---

## 📂 Project Structure
- `apps/api`: NestJS REST API.
- `apps/web`: React Router v7 Frontend.
- `apps/chat-server`: Go-based WebSocket server.
- `packages/db`: Drizzle ORM schema and migrations.
- `turbo.json`: Monorepo task orchestration.
- `oxlintrc.json` / `oxcfmtrc.json`: Linting and formatting rules.

---

## 🔐 Environment Variables
Check `.env.example` in each application directory for the required variables:
- **API:** `PORT`, `CLIENT_APP_URL`, `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `CHAT_SERVER_TOKEN`.
- **Web:** `VITE_API_URL`, `VITE_WS_URL`, `UPLOADTHING_API_KEY`.
- **Chat Server:** `PORT`, `CLIENT_APP_URL`, `AUTH_SECRET`, `REDIS_URL`, `API_URL`, `CHAT_SERVER_TOKEN`.

---

## 💡 Pro-Tips for Agents
- **Fast Feedback:** Use `pnpm lint` and `pnpm typecheck` frequently; they are optimized for speed.
- **UI Consistency:** Check `apps/web/src/components/ui` before creating new UI components.
- **State Updates:** Prefer optimistic updates in TanStack Query for a snappier chat experience.
- **Communication:** The API and Chat Server communicate using a shared `CHAT_SERVER_TOKEN`. Ensure this is consistent across services.

---

## 🧩 Common Patterns

### API Controller (NestJS)
```typescript
@Controller("resource")
export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.service.findById(id);
  }
}
```

```

### Database Query (Drizzle)
```typescript
const result = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    profile: true,
  },
});
```

### Go Error Handling
```go
if err := r.ParseForm(); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
}
```

