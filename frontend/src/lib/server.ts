import { api } from "./axios";
import type { Session } from "./types";
export async function auth(req: Request): Promise<Session> {
  const res = await api.get("/auth/session", {
    headers: {
      Cookie: req.headers.get("Cookie") || "",
    },
  });
  if (!res.data) {
    throw new Error("Something went wrong");
  }
  return res.data;
}
