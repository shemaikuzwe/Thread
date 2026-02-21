import { api } from "./axios";
import type { Session } from "./types";
import { headers } from "next/headers";

export async function auth(req?: Request): Promise<Session> {
  try {
    const cookieHeader = req
      ? req.headers.get("Cookie")
      : (await headers()).get("Cookie");

    const res = await api.get("/auth/session", {
      headers: {
        Cookie: cookieHeader || "",
      },
    });
    if (!res.data) {
      throw new Error("Something went wrong");
    }
    return res.data;
  } catch (error) {
    console.error(error);
    return { status: "un_authenticated", user: null };
  }
}
