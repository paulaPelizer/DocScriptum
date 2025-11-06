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
 * Chaves para guardar usuário e papéis (roles).
 * Ex.: roles = ["DBA","ADMIN","RESOURCE"]
 */
const USER_KEY = "auth:username";
const ROLES_KEY = "auth:roles";

/**
 * Chave para guardar a rota de retorno após o login.
 */
const RETURN_TO_KEY = "auth:returnTo";

/**
 * Caminho da tela de login (ajuste se sua rota for outra).
 */
export const LOGIN_PATH = "/login";

/**
 * Margem de segurança ao validar expiração do JWT (em segundos).
 * Ideal manter em linha com security.jwt.clock-skew-seconds do backend (application.yml).
 */
const JWT_SKEW_SECONDS = 30;

/** Utils */
const currentPath = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

/* ===================== JWT HELPERS ===================== */

/**
 * Tenta decodificar o payload de um JWT sem validar a assinatura.
 * Retorna um objeto (claims) ou null em caso de erro.
 */
function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Verifica se um JWT está expirado com base no claim "exp".
 * exp é esperado em segundos desde 1970-01-01 (padrão JWT).
 */
function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    // se não tiver exp, não consideramos expirado do ponto de vista do front
    return false;
  }

  const nowSec = Date.now() / 1000;
  // considera expiração um pouco antes, para compensar skew de clock
  return nowSec > payload.exp - JWT_SKEW_SECONDS;
}

/* ===================== TOKEN / AUTH STATE ===================== */

export function getToken(): string | null {
  const token =
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);

  if (!token) return null;

  // se o token estiver expirado, limpa tudo e trata como deslogado
  if (isJwtExpired(token)) {
    logout();
    return null;
  }

  return token;
}

/** Autenticação efetiva: JWT OU cookie-only */
export function isAuthenticated(): boolean {
  const hasJwt = !!getToken(); // getToken já checa expiração
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
  // só envia Bearer se tiver JWT de verdade (e não expirado)
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

  // também limpar usuário e roles
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLES_KEY);

  // NÃO remover RETURN_TO_KEY aqui
  // (legado) sessionStorage.removeItem("post_login_redirect");
}

/* ===================== USER / ROLES HELPERS ===================== */

/** Guarda username + roles no storage. */
function setAuthUser(username?: string | null, roles?: string[] | null) {
  if (username) {
    localStorage.setItem(USER_KEY, username);
  } else {
    localStorage.removeItem(USER_KEY);
  }

  if (roles && roles.length) {
    // normaliza para strings simples
    const clean = Array.from(new Set(roles.map(String)));
    localStorage.setItem(ROLES_KEY, JSON.stringify(clean));
  } else {
    localStorage.removeItem(ROLES_KEY);
  }
}

/** Usuário atual (username ou e-mail). */
export function getCurrentUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

/** Perfis atuais (ex.: ["DBA","ADMIN","RESOURCE"]). */
export function getCurrentUserRoles(): string[] {
  const raw = localStorage.getItem(ROLES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((r) => String(r));
    }
  } catch {
    // ignore parse error
  }
  return [];
}

/**
 * Verifica se o usuário atual tem pelo menos um dentre os perfis informados.
 * Ex.: hasAnyRole("DBA","ADMIN")
 */
export function hasAnyRole(...roles: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  const current = getCurrentUserRoles().map((r) => r.toUpperCase());
  const wanted = roles.map((r) => r.toUpperCase());
  return wanted.some((r) => current.includes(r));
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

/** >>> NOVO: payload de registro com email <<< */
export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  token?: string; // token de registro (DBA/ADMIN/RESOURCE/USER)
}

/**
 * >>> NOVO: registro de usuário com email <<<
 * Chama o endpoint /api/v1/auth/register do backend.
 */
export async function register(payload: RegisterPayload): Promise<void> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      username: payload.username,
      password: payload.password,
      email: payload.email,
      token: payload.token,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || "Falha ao registrar usuário");
  }
}

/**
 * Efetua login contra o backend (JWT ou cookie).
 * Retorna o token (se houver) e,
 * como efeito colateral, salva username + roles no storage.
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

  let token: string | null = null;
  let usernameFromServer: string | undefined;
  let rolesFromServer: string[] | undefined;

  // tenta extrair token + username + roles do corpo (formato do AuthController)
  try {
    const data = await res.json();
    token =
      data?.token ??
      data?.jwt ??
      data?.access_token ??
      data?.accessToken ??
      null;

    if (data?.username) {
      usernameFromServer = String(data.username);
    }
    if (Array.isArray(data?.roles)) {
      rolesFromServer = data.roles.map((r: any) => String(r));
    }
  } catch {
    // backend pode responder vazio em fluxo cookie-only
  }

  // se não veio no body, tenta no cabeçalho Authorization
  if (!token) {
    const auth = res.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) token = auth.substring(7);
  }

  // salva usuário + roles no storage;
  // se o servidor não mandou username, usa o que foi digitado no formulário
  setAuthUser(usernameFromServer || username, rolesFromServer || []);

  return token;
}

/* ===================== 401/403 Handler ===================== */

/**
 * 401/403:
 * - Limpa credenciais (inclui flag cookie-only e roles)
 * - Salva rota atual (se ainda não houver uma salva)
 * - Redireciona para /login?returnTo=<rota_atual>
 * - Lança erro para interromper o fluxo
 */
export function handleAuthErrorAndRedirect(rawMessage = ""): never {
  const cur = currentPath();

  // 1) limpa credenciais (token + flag cookie + user/roles)
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
