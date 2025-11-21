// src/services/projects.ts
import { apiGet, apiPost } from "@/services/api"

/* =====================================
   Tipos de requisição e resposta
===================================== */

export interface CreateProjectRequest {
  code: string
  name: string
  clientId?: number | null
  statusInicial?: string | null
  dataInicio?: string | null
  dataPrevistaConclusao?: string | null
  description?: string | null
  disciplinas?: Array<{
    disciplinaId?: number | null
    disciplinaNome?: string | null
    destinatarioCliente?: string | null
    destinatarioInterno?: string | null
    tipos?: Array<{ tipo: string; quantidade?: number | null }>
  }>
  marcos?: Array<{
    marcoContratual: string
    dataLimite?: string | null
    descricao?: string | null
  }>
}

export interface ProjectResponse {
  id: number
  code: string
  name: string
  status?: string
  clientId?: number | null
  clientName?: string | null
  startDate?: string | null
  plannedEndDate?: string | null
  description?: string | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export type ClientProjectCount = { clientId: number; count: number }

/* =====================================
   ➕ Tipos previstos de documentos
===================================== */

export interface ProjectDocType {
  id: number
  projectDisciplineId: number
  disciplineName: string
  docType: string
  quantity: number
}

/* =====================================
   ➕ Detalhes do projeto (milestones + docs)
===================================== */

export interface Milestone {
  id: number
  name: string
  description?: string | null
  dueDate?: string | null
  projectId: number
}

export interface DocumentSummary {
  id: number
  code: string
  title: string
  revision?: string | null
  projectId: number | null
  type?: string | null
  status?: string | null
  milestoneName?: string | null
  fileName?: string | null
  lastModified?: string | null
  uploadedBy?: string | null
}

export interface ProjectDetail {
  id: number
  code: string
  name: string
  clientName?: string | null
  description?: string | null
  status?: string | null
  startDate?: string | null
  plannedEndDate?: string | null

  milestones: Milestone[]
  documents: DocumentSummary[]

  // 🔥 Tipos previstos que vêm do backend
  plannedDocTypes: ProjectDocType[]
}

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
  }
  return apiPost<ProjectResponse>("/projects", payload)
}

/* =====================================
   Buscar detalhes do projeto
===================================== */

export async function getProjectDetail(id: number): Promise<ProjectDetail> {
  return apiGet<ProjectDetail>(`/projects/${id}/detail`)
}

/* =====================================
   Leitura por cliente (org)
===================================== */

export async function getProjectsByOrg(
  orgId: number,
  opts: { page?: number; size?: number; sort?: string } = {}
): Promise<Page<ProjectResponse>> {
  const { page = 0, size = 20, sort } = opts

  async function tryParam(paramName: "orgId" | "clientId") {
    const qs = new URLSearchParams()
    qs.set(paramName, String(orgId))
    qs.set("page", String(page))
    qs.set("size", String(size))
    if (sort) qs.set("sort", sort)

    return apiGet<any>(`/projects?${qs.toString()}`)
  }

  try {
    const data = await tryParam("orgId")
    return normalizeProjectsList(data, page, size)
  } catch {
    const data = await tryParam("clientId")
    return normalizeProjectsList(data, page, size)
  }
}

/* =====================================
   Contagem de projetos por cliente
===================================== */

export async function fetchProjectCountsForMany(
  clientIds: number[]
): Promise<Record<number, number>> {
  const ids = Array.from(new Set(clientIds)).filter((v) => Number.isFinite(v))
  if (ids.length === 0) return {}

  try {
    const qs = encodeURIComponent(ids.join(","))
    const data = await apiGet<any>(`/projects/count-by-client?ids=${qs}`)

    const map: Record<number, number> = {}

    if (Array.isArray(data)) {
      for (const row of data as ClientProjectCount[]) {
        if (row && typeof row.clientId === "number") {
          map[row.clientId] = Number(row.count ?? 0)
        }
      }
      return map
    }

    if (data && typeof data === "object" && (data as any).counts) {
      for (const [k, v] of Object.entries<any>((data as any).counts)) {
        const cid = Number(k)
        if (!Number.isNaN(cid)) map[cid] = Number(v ?? 0)
      }
      return map
    }

    if (data && typeof data === "object") {
      for (const [k, v] of Object.entries<any>(data)) {
        const cid = Number(k)
        if (!Number.isNaN(cid)) map[cid] = Number(v ?? 0)
      }
      return map
    }

    throw new Error("Formato inesperado")
  } catch {
    const pairs = await Promise.all(
      ids.map(async (id) => ({ id, n: await fetchProjectCountByOrg(id) }))
    )
    const map: Record<number, number> = {}
    for (const p of pairs) map[p.id] = p.n
    return map
  }
}

export async function fetchProjectCountByOrg(orgId: number): Promise<number> {
  async function tryParam(paramName: "orgId" | "clientId"): Promise<number | null> {
    try {
      const res: any = await apiGet(
        `/projects?${paramName}=${orgId}&page=0&size=1`
      )
      if (res && typeof res.totalElements === "number") return res.totalElements
      if (res && res.content && typeof res.totalElements === "number")
        return res.totalElements
      if (Array.isArray(res)) return res.length
    } catch {}
    return null
  }

  const byOrg = await tryParam("orgId")
  if (byOrg !== null) return byOrg

  const byClient = await tryParam("clientId")
  if (byClient !== null) return byClient

  return 0
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
    return data as Page<ProjectResponse>
  }
  if (Array.isArray(data)) {
    const total = data.length
    return {
      content: data as ProjectResponse[],
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
      size,
      number: page,
    }
  }
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size,
    number: page,
  }
}
