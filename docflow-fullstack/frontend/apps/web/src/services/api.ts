import { getToken, handleAuthErrorAndRedirect } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

function buildUrl(path: string) {
  // aceita tanto /rota quanto URL absoluta
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

function mustAddJsonContentType(init?: RequestInit) {
  // só adiciona se houver body, não for FormData e header não tiver sido setado
  const hasBody = !!init?.body;
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  return hasBody && !isFormData;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  // headers
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (mustAddJsonContentType(options) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include", // mantém cookie (JSESSIONID) se existir
  });

  // ================================
  // ⚠️ Ajuste: apenas 401 redireciona
  // ================================
  if (res.status === 401) {
    let msg = "";
    try {
      msg = await res.text();
    } catch {}
    handleAuthErrorAndRedirect(msg);
    throw new Error("Sessão expirada — faça login novamente.");
  }

  // 403 => apenas lança erro, não redireciona
  if (res.status === 403) {
    let msg = "Acesso negado.";
    try {
      msg = await res.text();
    } catch {}
    throw new Error(msg || "403 - Acesso negado.");
  }

  if (!res.ok) {
    // tenta extrair mensagem de erro genérica
    let msg = res.statusText;
    try {
      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        msg =
          (typeof data === "string" && data) ||
          data?.message ||
          data?.error ||
          JSON.stringify(data);
      } else {
        msg = await res.text();
      }
    } catch {
      // mantém statusText
    }
    throw new Error(`Erro ${res.status}: ${msg}`);
  }

  // sucesso → tenta parsear JSON; se não for JSON/204, retorna undefined
  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }

  // Se precisar lidar com blob/text, adapte aqui.
  return undefined as T;
}

/* Helpers convenientes */
export function apiGet<T = any>(path: string, init?: RequestInit) {
  return apiFetch<T>(path, { method: "GET", ...init });
}

export function apiPost<T = any>(path: string, body?: any, init?: RequestInit) {
  const isForm = body instanceof FormData;
  return apiFetch<T>(path, {
    method: "POST",
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
    ...init,
  });
}

export function apiPut<T = any>(path: string, body?: any, init?: RequestInit) {
  const isForm = body instanceof FormData;
  return apiFetch<T>(path, {
    method: "PUT",
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
    ...init,
  });
}

export function apiDelete<T = any>(path: string, init?: RequestInit) {
  return apiFetch<T>(path, { method: "DELETE", ...init });
}
