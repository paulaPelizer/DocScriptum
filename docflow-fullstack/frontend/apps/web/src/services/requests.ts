import { apiGet, apiPost } from "@/services/api"

/* =========================
   Tipos de domínio
========================= */

export type RequestStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"

/** DTO de listagem (vem do RequestSummaryDTO do backend) */
export interface RequestSummary {
  id: number
  number: string
  projectId: number | null
  projectName: string | null
  originId: number | null
  originName: string | null
  targetId: number | null
  targetName: string | null
  purpose: string | null
  documents: number
  /** ISO; no backend pode vir nulo → deixamos opcional/nullable no TS */
  requestDate?: string | null
  status: RequestStatus
}

/** Estrutura padrão de paginação do backend */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/* =========================
   Tipos para criação (POST)
========================= */

export interface CreateRequestDTO {
  projectId: number
  requesterOrgId: number
  targetOrgId: number

  requesterUserId?: number

  purpose?: string
  description?: string

  requesterName?: string
  requesterContact?: string

  targetName?: string
  targetContact?: string

  /** ISO string; opcional */
  requestDate?: string
  desiredDeadline?: string | null

  justification?: string
  specialInstructions?: string

  documentIds?: number[]

  /** campo opcional para metadados/snapshot que você está enviando */
  metadataJson?: string
}

export interface RequestResponseDTO {
  id: number
  requestNumber: string
}

/* =========================
   Chamadas de API
========================= */

/** POST /api/v1/requests */
export async function createRequest(body: CreateRequestDTO) {
  // 🔧 ajuste principal: incluir o /api/v1 aqui também
  return apiPost<RequestResponseDTO>("/api/v1/requests", body)
}

/** GET /api/v1/requests — 1 status por chamada (paginado no backend) */
export async function listRequests(params?: {
  q?: string
  status?: RequestStatus
  page?: number
  size?: number
  sort?: string // ex.: "requestDate,desc"
}) {
  const query = new URLSearchParams()
  if (params?.q) query.set("q", params.q)
  if (params?.status) query.set("status", params.status)
  query.set("page", String(params?.page ?? 0))
  query.set("size", String(params?.size ?? 20))
  query.set("sort", params?.sort ?? "requestDate,desc")

  return apiGet<Page<RequestSummary>>(`/api/v1/requests?${query.toString()}`)
}

/**
 * Combina resultados de múltiplos status (merge client-side).
 * Útil para as abas:
 *  - Pendentes: PENDING + IN_PROGRESS
 *  - Concluídas: COMPLETED + REJECTED + CANCELLED
 */
export async function listRequestsManyStatuses(params: {
  q?: string
  statuses: RequestStatus[]
  page?: number
  size?: number
  sort?: string // "requestDate,desc" | "requestDate,asc"
}) {
  const { q, statuses, page = 0, size = 20, sort = "requestDate,desc" } = params

  // buscamos um pouco mais por status para garantir volume antes do merge
  const perStatusSize = Math.max(size * 2, 50)

  const results = await Promise.all(
    statuses.map((st) =>
      listRequests({ q, status: st, page: 0, size: perStatusSize, sort }).catch(() => ({
        content: [] as RequestSummary[],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: perStatusSize,
      }))
    )
  )

  const all = results.flatMap((r) => r.content)

  // dedup por id
  const dedup = new Map<number, RequestSummary>()
  all.forEach((item) => dedup.set(item.id, item))
  const merged = Array.from(dedup.values())

  // ordenar por requestDate
  const [, dir] = sort.split(",")
  merged.sort((a, b) => {
    const av = a.requestDate ?? ""
    const bv = b.requestDate ?? ""
    return dir?.toLowerCase() === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  // paginação client-side
  const totalElements = merged.length
  const totalPages = Math.max(1, Math.ceil(totalElements / size))
  const start = page * size
  const end = start + size
  const content = merged.slice(start, end)

  return {
    content,
    totalElements,
    totalPages,
    number: page,
    size,
  } as Page<RequestSummary>
}

/* =========================
   Helpers
========================= */

/** Grupos de status usados nas abas do frontend */
export const REQUEST_STATUS_GROUPS = {
  pending: ["PENDING", "IN_PROGRESS"] as RequestStatus[],
  done: ["COMPLETED", "REJECTED", "CANCELLED"] as RequestStatus[],
}
