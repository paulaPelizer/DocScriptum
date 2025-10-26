// src/services/api.ts
import { getToken } from "./auth";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
    credentials: "include", // necessário para enviar cookie
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Erro ${res.status}: ${msg}`);
  }

  const ct = res.headers.get("Content-Type") || "";
  return ct.includes("application/json")
    ? ((await res.json()) as T)
    : (undefined as T);
}
