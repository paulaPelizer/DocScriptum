// src/services/auth.ts

/**
 * Chaves de armazenamento do token (compat com trechos antigos).
 */
const TOKEN_KEY = "docflow_token";
const LEGACY_TOKEN_KEY = "auth_token";

/**
 * Flag para fluxo cookie-only (sem JWT).
 * Quando presente == "1", consideramos o usuário autenticado.
 */
const COOKIE_AUTH_KEY = "auth:cookie";

/**
 * Chave para guardar a rota de retorno após o login.
 */
const RETURN_TO_KEY = "auth:returnTo";

/**
 * Caminho da tela de login (ajuste se sua rota for outra).
 */
export const LOGIN_PATH = "/login";

/** Utils */
const currentPath = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

/* ===================== TOKEN / AUTH STATE ===================== */

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY)
  );
}

/** Autenticação efetiva: JWT OU cookie-only */
export function isAuthenticated(): boolean {
  const hasJwt = !!getToken();
  const hasCookieFlag = localStorage.getItem(COOKIE_AUTH_KEY) === "1";
  return hasJwt || hasCookieFlag;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

/** Marca que o usuário está autenticado via cookie (sem JWT). */
function setCookieAuthFlag(on: boolean) {
  if (on) localStorage.setItem(COOKIE_AUTH_KEY, "1");
  else localStorage.removeItem(COOKIE_AUTH_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const t = getToken();
  // só envia Bearer se tiver JWT de verdade
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * Remove credenciais locais.
 * ⚠️ NÃO remove RETURN_TO_KEY aqui para preservar retorno pós-login.
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  setCookieAuthFlag(false);
  // NÃO remover RETURN_TO_KEY aqui
  // (legado) sessionStorage.removeItem("post_login_redirect");
}

/* ===================== RETURN TO ===================== */

export function setReturnTo(path: string) {
  if (!path) return;
  localStorage.setItem(RETURN_TO_KEY, path);
}

export function getReturnTo(): string | null {
  return localStorage.getItem(RETURN_TO_KEY);
}

export function takeReturnTo(): string | null {
  const v = localStorage.getItem(RETURN_TO_KEY);
  if (v) localStorage.removeItem(RETURN_TO_KEY);
  return v;
}

/** Opcional: chame na tela de login para persistir ?returnTo=... mesmo após refresh */
export function persistReturnToFromQuery() {
  const q = new URLSearchParams(window.location.search);
  const fromQuery = q.get("returnTo");
  if (fromQuery && !getReturnTo()) setReturnTo(fromQuery);
}

/* ===================== LOGIN FLOW ===================== */

export function finishLogin(token?: string, navigate?: (to: string) => void) {
  // Se veio token → grava. Se não, é cookie-only → marca flag.
  if (token) {
    setToken(token);
    setCookieAuthFlag(false);
  } else {
    // login OK sem token ⇒ cookie-only
    setCookieAuthFlag(true);
  }

  const urlParams = new URLSearchParams(window.location.search);
  const fromQuery = urlParams.get("returnTo");
  const fromNewStorage = takeReturnTo();
  const fromLegacy = sessionStorage.getItem("post_login_redirect");
  if (fromLegacy) sessionStorage.removeItem("post_login_redirect");

  const target = fromQuery || fromNewStorage || fromLegacy || "/projects";

  if (navigate) navigate(target);
  else window.location.replace(target);
}

/**
 * Efetua login contra o backend (JWT ou cookie).
 * Retorna o token (se houver).
 */
export async function login(
  username: string,
  password: string
): Promise<string | null> {
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

  // tenta extrair token do corpo (formatos comuns)
  let token: string | null = null;
  try {
    const data = await res.json();
    token =
      data?.token ??
      data?.jwt ??
      data?.access_token ??
      data?.accessToken ??
      null;
  } catch {
    // backend pode responder vazio em fluxo cookie-only
  }

  // se não veio no body, tenta no cabeçalho Authorization
  if (!token) {
    const auth = res.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) token = auth.substring(7);
  }

  return token;
}

/* ===================== 401/403 Handler ===================== */

/**
 * 401/403:
 * - Limpa credenciais (inclui flag cookie-only)
 * - Salva rota atual (se ainda não houver uma salva)
 * - Redireciona para /login?returnTo=<rota_atual>
 * - Lança erro para interromper o fluxo
 */
export function handleAuthErrorAndRedirect(rawMessage = ""): never {
  const cur = currentPath();

  // 1) limpa credenciais (token + flag cookie)
  logout();

  // 2) guarda retorno (novo e legado) se ainda não salvo
  if (!getReturnTo()) setReturnTo(cur);
  if (!sessionStorage.getItem("post_login_redirect")) {
    sessionStorage.setItem("post_login_redirect", cur);
  }

  // 3) evita loop no /login
  if (!window.location.pathname.startsWith(LOGIN_PATH)) {
    const target = `${LOGIN_PATH}?returnTo=${encodeURIComponent(cur)}`;
    window.location.replace(target);
  }

  throw new Error(`Não autorizado. Faça login novamente.\n${rawMessage}`);
}
