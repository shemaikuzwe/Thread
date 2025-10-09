import { redirect } from "react-router";
import { api } from "./lib/axios";
import type { Session } from "./lib/types";

export async function auth() {
  if (!(await isLoggedIn())) {
    throw redirect("/auth/login");
  }
}
async function isLoggedIn() {
  const res = await api.get("/auth/session");
  if (res.status !== 200) {
    throw new Error("Something went wrong");
  }
  const data = res.data as Session;
  if (data.status !== "authenticated") {
    throw redirect("/auth/login");
  }
  return data;
}
