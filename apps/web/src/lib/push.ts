import { fetcher } from "./fetcher";

export async function subscribeUser(sub: PushSubscription) {
  const res = await fetcher("/users/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sub }),
  });
  if (!res.ok) {
    return { success: false };
  }
  return { success: true };
}

export async function unsubscribeUser(sub: PushSubscription) {
  const res = await fetcher(`/users/subscription/${encodeURIComponent(sub.endpoint)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    return { success: false };
  }
  return { success: true };
}
