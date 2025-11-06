// src/services/documents.ts
import { apiGet, apiPost } from "@/services/api"

/** --------- Tipos do backend (compatíveis com DocumentFormDataDTO) ---------- */
export type ProjectSummary = { id: number; code: string; name: string }
export type DisciplineDTO = { id: number; code?: string | null; name: string }
export type DocTypeDTO = { id: number; code?: string | null; name: string; disciplineId?: number | null }
export type SimpleIdNameDTO = { id: number; name: string }

export type DocumentFormDataDTO = {
  projects: ProjectSummary[]
  disciplines: DisciplineDTO[]
  docTypes: DocTypeDTO[]
  responsibles: SimpleIdNameDTO[]
  clients: SimpleIdNameDTO[]
  suppliers: SimpleIdNameDTO[]
}

/** --------- GET /documents/form-data (opcionalmente filtrado por projeto) ---------- */
export async function getDocumentFormData(projectId?: number) {
  const qs = projectId ? `?projectId=${projectId}` : ""
  return apiGet<DocumentFormDataDTO>(`/api/v1/documents/form-data${qs}`)
}

/** --------- POST /documents  (criação) ---------- */
/** Mantido o mesmo nome do tipo para compatibilidade. Agora inclui todos os campos do DTO. */
export type CreateDocumentPayload = {
  // obrigatórios
  projectId: number
  code: string
  title: string
  revision: string

  // opcionais antigos
  format?: string | null
  pages?: number | null
  fileUrl?: string | null

  // vínculos auxiliares (vindos dos GETs do formulário)
  clientId?: number | null
  disciplineId?: number | null
  documentTypeId?: number | null

  // informações do documento
  species?: string | null
  description?: string | null
  layoutRef?: string | null
  templateId?: number | null

  // responsabilidade e prazos
  technicalResponsible?: string | null
  performedDate?: string | null  // dd/MM/yyyy
  dueDate?: string | null        // dd/MM/yyyy

  // status/localização/observações
  status?: string | null
  currentLocation?: string | null
  remarks?: string | null

  // upload (hash fictícia por enquanto)
  uploadHash?: string | null
}

export type CreateDocumentResponse = number

export async function createDocument(payload: CreateDocumentPayload) {
  return apiPost<CreateDocumentResponse>("/api/v1/documents", payload) // retorna o id criado
}
