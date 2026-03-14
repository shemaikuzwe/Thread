import api from "./api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  createdAt: string;
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function register(firstName: string, lastName: string, email: string, password: string) {
  const { data } = await api.post("/auth/signup", { firstName, lastName, email, password });
  return data;
}

export async function logout() {
  const { data } = await api.post("/auth/logout");
  return data;
}
