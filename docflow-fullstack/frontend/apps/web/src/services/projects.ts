// src/services/projects.ts
import { apiGet, apiPost } from "@/services/api";

/* =====================================
   Tipos de requisição e resposta
===================================== */

export interface CreateProjectRequest {
  code: string;
  name: string;
  clientId?: number | null;              // backend espera clientId
  statusInicial?: string | null;         // backend espera statusInicial
  dataInicio?: string | null;            // formato "dd/MM/yyyy"
  dataPrevistaConclusao?: string | null; // formato "dd/MM/yyyy"
  description?: string | null;           // campo opcional
  disciplinas?: Array<{
    disciplinaId?: number | null;
    disciplinaNome?: string | null;
    destinatarioCliente?: string | null;
    destinatarioInterno?: string | null;
    tipos?: Array<{ tipo: string; quantidade?: number | null }>;
  }>;
  marcos?: Array<{
    marcoContratual: string;
    dataLimite?: string | null;
    descricao?: string | null;
  }>;
}

export interface ProjectResponse {
  id: number;
  code: string;
  name: string;
  status?: string;
  clientId?: number | null;
  clientName?: string | null;
  startDate?: string | null;
  plannedEndDate?: string | null;
  description?: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // página atual (0-based)
}

export type ClientProjectCount = { clientId: number; count: number };

/* =====================================
   Criar projeto
===================================== */

export async function createProject(data: CreateProjectRequest) {
  const payload: CreateProjectRequest = {
    code: data.code?.trim(),
    name: data.name?.trim(),
    clientId: data.clientId ?? null,
    statusInicial: data.statusInicial ?? null,
    dataInicio: data.dataInicio ?? null,
    dataPrevistaConclusao: data.dataPrevistaConclusao ?? null,
    description: data.description ?? null,
    disciplinas: data.disciplinas ?? [],
    marcos: data.marcos ?? [],
  };
  return apiPost<ProjectResponse>("/projects", payload);
}

/* =====================================
   Leitura por cliente (org)
===================================== */

/**
 * Lista projetos de um cliente/organization.
 * Tenta com ?orgId= primeiro, depois ?clientId= (dependendo do back).
 * Retorna um Page<ProjectResponse> se a API for paginada;
 * caso contrário, adapta um array em um "Page" básico.
 */
export async function getProjectsByOrg(
  orgId: number,
  opts: { page?: number; size?: number; sort?: string } = {}
): Promise<Page<ProjectResponse>> {
  const { page = 0, size = 20, sort } = opts;

  async function tryParam(paramName: "orgId" | "clientId") {
    const qs = new URLSearchParams();
    qs.set(paramName, String(orgId));
    qs.set("page", String(page));
    qs.set("size", String(size));
    if (sort) qs.set("sort", sort);

    return apiGet<any>(`/projects?${qs.toString()}`);
  }

  try {
    const data = await tryParam("orgId");
    return normalizeProjectsList(data, page, size);
  } catch {
    const data = await tryParam("clientId");
    return normalizeProjectsList(data, page, size);
  }
}

/* =====================================
   Contagem de projetos por cliente
===================================== */

/**
 * Contagem de projetos para vários clientes em UMA chamada:
 * GET /projects/count-by-client?ids=1,2,3
 *
 * Formatos aceitos do backend:
 * 1) Array de objetos: [{ clientId: 1, count: 3 }, ...]
 * 2) Objeto "counts": { counts: { "1": 3, "2": 0, ... } }
 *
 * Fallback: se o endpoint não existir, faz uma chamada por id
 * usando paginação mínima (/projects?orgId=ID&page=0&size=1)
 * para ler totalElements.
 */
export async function fetchProjectCountsForMany(
  clientIds: number[]
): Promise<Record<number, number>> {
  const ids = Array.from(new Set(clientIds)).filter((v) => Number.isFinite(v));
  if (ids.length === 0) return {};

  // 1) Tenta o endpoint agregado
  try {
    const qs = encodeURIComponent(ids.join(","));
    const data = await apiGet<any>(`/projects/count-by-client?ids=${qs}`);

    const map: Record<number, number> = {};

    // a) Array de { clientId, count }
    if (Array.isArray(data)) {
      for (const row of data as ClientProjectCount[]) {
        if (row && typeof row.clientId === "number") {
          map[row.clientId] = Number(row.count ?? 0);
        }
      }
      return map;
    }

    // b) Objeto { counts: { "1": 3, "2": 0 } }
    if (data && typeof data === "object" && data.counts) {
      for (const [k, v] of Object.entries<any>(data.counts)) {
        const cid = Number(k);
        if (!Number.isNaN(cid)) map[cid] = Number(v ?? 0);
      }
      return map;
    }

    // c) Objeto simples { "1": 3, "2": 0 }
    if (data && typeof data === "object") {
      for (const [k, v] of Object.entries<any>(data)) {
        const cid = Number(k);
        if (!Number.isNaN(cid)) map[cid] = Number(v ?? 0);
      }
      return map;
    }

    // Se chegou aqui, formato inesperado → cai no fallback
    throw new Error("Formato de resposta inesperado");
  } catch {
    // 2) Fallback: N chamadas (uma por id)
    const pairs = await Promise.all(
      ids.map(async (id) => ({ id, n: await fetchProjectCountByOrg(id) }))
    );
    const map: Record<number, number> = {};
    for (const p of pairs) map[p.id] = p.n;
    return map;
  }
}

/**
 * Conta projetos de um único cliente/organization (fallback).
 * Estratégia:
 * - Tenta endpoint paginado e usa totalElements.
 * - Se vier um array, usa length.
 * - Tenta ?orgId primeiro; se falhar, ?clientId.
 */
export async function fetchProjectCountByOrg(orgId: number): Promise<number> {
  async function tryParam(paramName: "orgId" | "clientId"): Promise<number | null> {
    try {
      const res: any = await apiGet(`/projects?${paramName}=${orgId}&page=0&size=1`);
      // Page do Spring
      if (res && typeof res.totalElements === "number") return res.totalElements;
      // Algumas APIs retornam { content: [], totalElements: N }
      if (res && res.content && typeof res.totalElements === "number") return res.totalElements;
      // Array simples
      if (Array.isArray(res)) return res.length;
    } catch {
      // ignora e tenta o próximo
    }
    return null;
  }

  const byOrg = await tryParam("orgId");
  if (byOrg !== null) return byOrg;

  const byClient = await tryParam("clientId");
  if (byClient !== null) return byClient;

  return 0;
}

/* =====================================
   Utils
===================================== */

function normalizeProjectsList(
  data: any,
  page: number,
  size: number
): Page<ProjectResponse> {
  if (data && typeof data.totalElements === "number" && Array.isArray(data.content)) {
    // já é Page
    return data as Page<ProjectResponse>;
  }
  if (Array.isArray(data)) {
    // adapta array em Page
    const total = data.length;
    return {
      content: data as ProjectResponse[],
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      size,
      number: page,
    };
  }
  // fallback seguro
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size,
    number: page,
  };
}
