// src/services/clients.ts
import { apiGet } from "./api";

/** DTO vindo do backend */
export type ClientDTO = {
  id: number;
  // empresa
  name: string;
  cnpj?: string | null;
  description?: string | null;
  status?: "ATIVO" | "INATIVO" | "PROSPECTO" | string | null;
  segment?: string | null;
  // endereço
  addrStreet?: string | null;
  addrNumber?: string | null;
  addrComplement?: string | null;
  addrDistrict?: string | null;
  addrZipcode?: string | null;
  addrCity?: string | null;
  addrState?: string | null;
  // contato
  contactName?: string | null;
  contactRole?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactNotes?: string | null;

  /** novo: total de projetos do cliente (mapeado de qtd_projetos) */
  projectsCount?: number | null;
};

export type PageResp<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página atual (0-based)
  size: number;
  first?: boolean;
  last?: boolean;
};

/** Busca clientes paginados. Aceita filtro ?q= */
export function listClients(params?: { page?: number; size?: number; q?: string }) {
  const { page = 0, size = 20, q } = params || {};
  const sp = new URLSearchParams({ page: String(page), size: String(size) });
  if (q && q.trim()) sp.set("q", q.trim());
  return apiGet<PageResp<ClientDTO>>(`/clients?${sp.toString()}`);
}

/** Helper de label bonita pro status */
export function statusLabel(s?: string | null) {
  if (!s) return "—";
  const up = s.toUpperCase();
  if (up === "ATIVO") return "Ativo";
  if (up === "INATIVO") return "Inativo";
  if (up === "PROSPECTO") return "Prospecto";
  return s;
}
