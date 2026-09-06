import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "corretor";
  phone: string | null;
  created_at: string;
};

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${data.session?.access_token}`,
    "Content-Type": "application/json",
  };
}

export async function listUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_URL}/admin/users`, { headers: await authHeaders() });
  if (!res.ok) throw new Error("Falha ao carregar usuários");
  return res.json();
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "corretor";
}): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Falha ao criar usuário");
  }
}

export async function updateUser(
  id: string,
  input: { name: string; email: string; role: "admin" | "corretor" },
): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Falha ao editar usuário");
  }
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Falha ao excluir usuário");
  }
}
