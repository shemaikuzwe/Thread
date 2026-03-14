import { api } from "./axios";

export async function subscribeUser(sub: PushSubscription) {
  const res = await api.post("/users/subscription", { sub });
  console.log(res);
  if (res.status !== 200) {
    return { success: false };
  }
  return { success: true };
}

export async function unsubscribeUser(sub: PushSubscription) {
  const res = await api.delete(`/users/subscription/${encodeURIComponent(sub.endpoint)}`);
  if (res.status !== 200) {
    return { success: false };
  }
  return { success: true };
}
