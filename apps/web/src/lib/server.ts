import { api } from "./axios";
import type { Session } from "./types";
import { headers } from "next/headers";

export async function auth(req?: Request): Promise<Session> {
  try {
    const cookieHeader = req
      ? req.headers.get("Cookie")
      : (await headers()).get("Cookie");

    const res = await api.get("/auth/get-session", {
      headers: {
        Cookie: cookieHeader || "",
      },
    });
    
    return {
      data: res.data,
      isPending: false,
      error: null
    };
  } catch (error) {
    console.error(error);
    return { 
      data: null, 
      isPending: false, 
      error: error 
    };
  }
}
