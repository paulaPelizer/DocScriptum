// src/services/api.ts
import { getToken, handleAuthErrorAndRedirect } from "./auth"

/**
 * Base da API
 * - Defina VITE_API_BASE (ex.: http://localhost:8080/api/v1)
 * - Se não definir, usa "/api/v1" (proxy do Vite).
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE ?? "/api/v1").trim()

/** Normaliza a base:
 *  - se absoluta: remove barra final
 *  - se relativa: garante que começa com "/" e não termina com "/"
 */
const API_BASE = (() => {
  let b = RAW_BASE
  if (/^https?:\/\//i.test(b)) return b.replace(/\/+$/, "")
  b = b.startsWith("/") ? b : `/${b}`
  return b.replace(/\/+$/, "")
})()

/** Junta dois pedaços removendo barras duplicadas */
function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}

/** Monta a URL final sem duplicar /api nem /v1 e respeitando o proxy do Vite */
function buildUrl(path: string) {
  // URL absoluta → retorna como veio
  if (/^https?:\/\//i.test(path)) return path

  // Já usando o proxy (/api/...) → não prefixa e saneia
  if (path.startsWith("/api/")) {
    return path
      .replace(/\/{2,}/g, "/")
      .replace(/\/api\/v1\/api\//, "/api/")
      .replace(/\/api\/v1\/v1\//, "/api/v1/")
  }

  // Caminho relativo → garante barra inicial
  let p = path.startsWith("/") ? path : `/${path}`

  // Se já começa pela base (ex.: /api/v1/...), evita duplicar
  if (p.startsWith(API_BASE)) return p

  // Evita repetição quando a base termina em /api/v1 e o path começa com /api/v1
  if (API_BASE.endsWith("/api/v1") && p.startsWith("/api/v1/")) {
    p = p.replace(/^\/api\/v1/, "")
  }
  // Evita repetir quando a base é /api e o path já começa com /api
  if (API_BASE === "/api" && p.startsWith("/api/")) {
    p = p.replace(/^\/api/, "")
  }

  // Junta base + caminho e saneia
  const url = joinUrl(API_BASE, p)
  return url
    .replace(/([^:]\/)\/+/g, "$1")
    .replace(/\/api\/v1\/api\//, "/api/")
    .replace(/\/api\/v1\/v1\//, "/api/v1/")
}

/** ----------------- Querystring helpers ----------------- */
export function qs(params?: Record<string, any> | URLSearchParams | undefined) {
  if (!params) return ""
  if (params instanceof URLSearchParams) {
    const s = params.toString()
    return s ? `?${s}` : ""
  }
  const usp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) v.forEach((vv) => usp.append(k, String(vv)))
    else usp.set(k, String(v))
  })
  const s = usp.toString()
  return s ? `?${s}` : ""
}

export function withParams(path: string, params?: Record<string, any> | URLSearchParams) {
  const q = qs(params)
  return q ? `${path}${q}` : path
}

/** Só adiciona Content-Type JSON quando há body e não for FormData */
function mustAddJsonContentType(init?: RequestInit) {
  const hasBody = !!init?.body
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData
  return hasBody && !isFormData
}

/** Tenta interpretar resposta: JSON → texto → blob (fallback) */
async function parseResponse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("Content-Type") || ""
  if (ct.includes("application/json")) {
    return (await res.json()) as T
  }
  // Alguns PUT/DELETE podem retornar texto simples
  if (ct.startsWith("text/") || ct.includes("charset=")) {
    const txt = await res.text()
    return txt as unknown as T
  }
  // Fallback para blob (download, etc.)
  const blob = await res.blob()
  return blob as unknown as T
}

type ApiInit = RequestInit & { timeoutMs?: number }

export async function apiFetch<T = any>(
  path: string,
  options: ApiInit = {}
): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers || {})

  // Auth
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  // Content negotiation
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain;q=0.9, */*;q=0.8")
  }

  if (mustAddJsonContentType(options) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const url = buildUrl(path)

  // Timeout com AbortController (padrão 25s)
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 25000
  )

  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // mantém cookie (se houver)
      signal: controller.signal,
    })
  } catch (err: any) {
    clearTimeout(timeout)
    if (err?.name === "AbortError") {
      throw new Error("Tempo de resposta excedido. Tente novamente.")
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  // 401 → sessão expirada / não autenticado
  if (res.status === 401) {
    let msg = ""
    try {
      msg = await res.text()
    } catch {}
    // vai limpar credenciais, salvar rota atual e redirecionar para /login
    handleAuthErrorAndRedirect(msg)
    throw new Error("Sessão expirada — faça login novamente.")
  }

  // 403 → sem permissão
  if (res.status === 403) {
    let msg = "Acesso negado."
    try {
      const ct = res.headers.get("Content-Type") || ""
      if (ct.includes("application/json")) {
        const data = await res.json()
        msg =
          (typeof data === "string" && data) ||
          data?.message ||
          data?.error ||
          data?.detail ||
          JSON.stringify(data)
      } else {
        msg = (await res.text()) || msg
      }
    } catch {}
    throw new Error(msg || "403 - Acesso negado.")
  }

  // Outros erros
  if (!res.ok) {
    let msg = res.statusText
    try {
      const ct = res.headers.get("Content-Type") || ""
      if (ct.includes("application/json")) {
        const data = await res.json()
        msg =
          (typeof data === "string" && data) ||
          data?.message ||
          data?.error ||
          data?.detail ||
          data?.trace ||
          JSON.stringify(data)
      } else {
        const txt = await res.text()
        msg = txt || msg
      }
    } catch {}
    throw new Error(`Erro ${res.status}: ${msg}`)
  }

  // 204 → sem corpo
  if (res.status === 204) return undefined as T

  return parseResponse<T>(res)
}

/* =================== Helpers HTTP =================== */
export function apiGet<T = any>(path: string, init?: ApiInit) {
  return apiFetch<T>(path, { method: "GET", ...init })
}
export function apiPost<T = any>(path: string, body?: any, init?: ApiInit) {
  const isForm = body instanceof FormData
  return apiFetch<T>(path, {
    method: "POST",
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
    ...init,
  })
}
export function apiPut<T = any>(path: string, body?: any, init?: ApiInit) {
  const isForm = body instanceof FormData
  return apiFetch<T>(path, {
    method: "PUT",
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
    ...init,
  })
}
export function apiPatch<T = any>(path: string, body?: any, init?: ApiInit) {
  const isForm = body instanceof FormData
  return apiFetch<T>(path, {
    method: "PATCH",
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
    ...init,
  })
}
export function apiDelete<T = any>(path: string, init?: ApiInit) {
  return apiFetch<T>(path, { method: "DELETE", ...init })
}

/** Úteis para debug no console */
export function getApiBase() {
  return API_BASE
}
export function buildApiUrl(path: string) {
  return buildUrl(path)
}
