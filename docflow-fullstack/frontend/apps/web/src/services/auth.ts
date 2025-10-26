// src/services/auth.ts
const TOKEN_KEY = "docflow_token"; // ainda útil se um dia vier token

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string) {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // importante para cookie
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || "Falha ao autenticar");
  }

  // Tenta guardar token se existir, mas NÃO é obrigatório
  let token = "";
  try {
    const data = await res.json();
    token =
      data?.token ||
      data?.jwt ||
      data?.access_token ||
      data?.accessToken ||
      "";
  } catch {
    // backend respondeu vazio (tudo bem para cookie-only)
  }
  if (!token) {
    const auth = res.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) token = auth.substring(7);
  }
  if (token) localStorage.setItem(TOKEN_KEY, token);

  // sucesso: com ou sem token (cookie-only é válido)
  return true;
}
