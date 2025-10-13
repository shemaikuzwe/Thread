import { createContext, redirect, RouterContextProvider } from "react-router";
import type { Session } from "./lib/types";
import { api } from "./lib/axios";

export const userContext = createContext<Session | null>(null);

const publicRoutes = ["/", "/auth/login", "/auth/register"];

export async function authMiddleware({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) {
  const res = await api.get("/auth/session", {
    headers: {
      Cookie: request.headers.get("Cookie") || "",
    },
  });
  if (!res.data) {
    throw new Error("Something went wrong");
  }
  const user = res.data as Session;
  const url = new URL(request.url).pathname;
  const isLoggedIn = user.status === "authenticated";
  if (isLoggedIn && publicRoutes.includes(url)) {
    throw redirect("/chat");
  } else if (!isLoggedIn && !publicRoutes.includes(url)) {
    throw redirect("/auth/login");
  }
  context.set(userContext, user);
}
