import { createContext, redirect, RouterContextProvider } from "react-router";
import type { Session } from "./lib/types";
import { auth } from "./lib/server";

export const userContext = createContext<Session | null>(null);

const publicRoutes = ["/", "/auth/login", "/auth/register"];

export async function authMiddleware({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) {
  const user = await auth(request);
  const url = new URL(request.url).pathname;
  if (url.startsWith("/api")) {
    return;
  }
  const isLoggedIn = user.status === "authenticated";
  if (isLoggedIn && publicRoutes.includes(url)) {
    throw redirect("/chat");
  } else if (!isLoggedIn && !publicRoutes.includes(url)) {
    throw redirect("/auth/login");
  }
  context.set(userContext, user);
}
