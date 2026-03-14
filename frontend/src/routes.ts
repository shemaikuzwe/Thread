import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("pages/home-layout.tsx", [
    index("pages/index.tsx"),
    route("/auth/login", "pages/auth/login.tsx"),
    route("/auth/register", "pages/auth/register.tsx"),
  ]),
  layout("pages/chat/chat-layout.tsx", [
    route("/chat", "pages/chat/index.tsx"),
    route("/chat/:id", "pages/chat/chat.tsx"),
    route("/chat/settings", "pages/chat/settings.tsx"),
  ]),
  route("/api/uploadthing", "pages/api.uploadthing.ts"),
  route("*", "pages/not-found.tsx"),
] satisfies RouteConfig;
