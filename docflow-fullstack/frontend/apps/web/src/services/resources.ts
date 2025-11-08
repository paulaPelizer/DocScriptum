// src/services/resources.ts
import { apiPost } from "@/services/api"

export type ResourceStatus = "ATIVO" | "INATIVO"

export interface CreateResourceDTO {
  name: string
  role?: string
  status?: ResourceStatus
  email?: string
  phone?: string
  partnershipType?: string
  partnershipName?: string
  tags?: string[]
  notes?: string
}

export interface ResourceDTO extends CreateResourceDTO {
  id: number
}

export function createResource(body: CreateResourceDTO) {
  return apiPost<ResourceDTO>("/api/v1/resources", body)
}
