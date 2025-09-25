export async function checkLogin() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const res = await fetch(`${apiUrl}/auth/session`);
  if (!res.ok) {
    throw new Error("something went wrong");
  }
  const session = await res.json();
  if (session.status === "authenticated") {
    return true;
  }
  return false;
}
