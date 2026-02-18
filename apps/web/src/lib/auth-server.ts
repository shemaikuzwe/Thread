import { cookies } from "next/headers";
import type { User } from "./auth-client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  const res = await fetch(`${apiUrl}/auth/session`, {
    method: "GET",
    headers: {
      Cookie: `accessToken=${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { user?: User | null };
  return data.user ?? null;
}
