// src/pages/requests/new.tsx
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, FileText } from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { apiGet } from "@/services/api"
import * as RequestsApi from "@/services/requests"

/* ========================= Tipos ========================= */
type Project = { id: number; code?: string; name: string }
type Organization = { id: number; name: string; type?: "CLIENT" | "SUPPLIER" | "INTERNAL" }
type ProjectDocument = {
  id: number | string
  code?: string
  title?: string
  name?: string
  revision?: string | number
  projectId?: number
}
type User = { id: number; name?: string; email?: string; username?: string }
type DocPick = {
  id: string | number
  code: string
  name: string
  revision?: string | number
  projectId: number
  checked: boolean
}

type ProjectDetail = Record<string, any> & {
  id?: number
  code?: string
  name?: string
  status?: string
  startDate?: string
  plannedEndDate?: string
  client?: { id?: number; name?: string }
  customer?: { id?: number; name?: string }
  supplier?: { id?: number; name?: string }
  vendor?: { id?: number; name?: string }
  internalOrgId?: number
  ownerOrgId?: number
  organizationId?: number
  clientId?: number
  supplierId?: number
  organizationClientId?: number
  organizationSupplierId?: number
}

/* --------------------------- Helpers --------------------------- */
async function tryGet<T>(url: string): Promise<T | null> {
  try {
    return await apiGet<T>(url as any)
  } catch {
    return null
  }
}

function asArray<T>(maybe: any): T[] {
  if (Array.isArray(maybe)) return maybe as T[]
  if (maybe && Array.isArray(maybe.content)) return maybe.content as T[]
  if (maybe && Array.isArray(maybe.items)) return maybe.items as T[]
  return []
}

function dateToISO(d?: string | null) {
  if (!d) return undefined
  const [y, m, da] = d.split("-").map(Number)
  if (!y || !m || !da) return undefined
  return new Date(y, m - 1, da, 0, 0, 0).toISOString()
}

const toNumOrNull = (v: string) => (v && v !== "0" ? Number(v) : null)

/** Lê o token JWT do localStorage, tentando detectar automaticamente */
function getAuthToken(): string | null {
  // 1) tenta chaves mais comuns
  const knownKeys = [
    "docflow_token",
    "docflow-auth-token",
    "token",
    "authToken",
    "access_token",
    "jwt",
  ]

  for (const key of knownKeys) {
    const value = localStorage.getItem(key)
    if (value && value.includes(".") && value.split(".").length === 3) {
      console.log("[NewRequestPage] JWT encontrado em key conhecida:", key)
      return value
    }
  }

  // 2) se não achou, faz um scan de todas as chaves procurando algo com cara de JWT
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const value = localStorage.getItem(key)
    if (value && value.includes(".") && value.split(".").length === 3) {
      console.log("[NewRequestPage] JWT encontrado via scan em key:", key)
      return value
    }
  }

  console.log("[NewRequestPage] Nenhum JWT encontrado no localStorage")
  return null
}

/** Puxa o username/email de dentro do JWT */
function getAuthUsernameFromToken(): string | null {
  const token = getAuthToken()
  if (!token) return null

  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const payloadJson = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    )
    const username =
      payloadJson.username || payloadJson.sub || payloadJson.email || null

    console.log("[NewRequestPage] Payload JWT:", payloadJson)
    console.log("[NewRequestPage] Username/email detectado do JWT:", username)

    return username
  } catch (e) {
    console.error("[NewRequestPage] Erro ao decodificar payload do JWT:", e)
    return null
  }
}

/* =============================== Página - Nova Solicitação ============================== */
export default function NewRequestPage() {
  const navigate = useNavigate()

  // carregamentos/erros
  const [isBootLoading, setIsBootLoading] = useState(true)
  const [isDocsLoading, setIsDocsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // dados base
  const [projects, setProjects] = useState<Project[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [docs, setDocs] = useState<DocPick[]>([])

  // detail + snapshot
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null)
  const [projectSnapshot, setProjectSnapshot] = useState<{
    id?: number
    code?: string
    name?: string
    status?: string
    startDate?: string
    plannedEndDate?: string
    clientId?: number | null
    supplierId?: number | null
    internalOrgId?: number | null
  } | null>(null)

  // seleção do formulário
  const [projectId, setProjectId] = useState<string>("")
  const [requestType, setRequestType] = useState<string>("")
  const [purpose, setPurpose] = useState<string>("")
  const [priority, setPriority] = useState<string>("normal")
  const [requesterOrgId, setRequesterOrgId] = useState<string>("")
  const [targetOrgId, setTargetOrgId] = useState<string>("")
  const [requestUserId, setRequestUserId] = useState<string>("")
  const [requesterContact, setRequesterContact] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [requestDate, setRequestDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [deadline, setDeadline] = useState<string>("")
  const [justification, setJustification] = useState<string>("")
  const [specialInstructions, setSpecialInstructions] = useState<string>("")

  const clients = useMemo(
    () => orgs.filter((o) => o.type === "CLIENT"),
    [orgs]
  )
  const suppliers = useMemo(
    () => orgs.filter((o) => o.type === "SUPPLIER"),
    [orgs]
  )

  /* ======================= Boot ======================= */
  useEffect(() => {
    let abort = false
    setIsBootLoading(true)
    setErrorMsg(null)

    ;(async () => {
      try {
        const projs = asArray<Project>(await tryGet<any>("/api/v1/projects"))

        // ORGANIZAÇÕES
        let orgsData: Organization[] = []
        const orgsResp = await tryGet<any>("/api/v1/organizations")
        if (orgsResp) {
          orgsData = asArray<Organization>(orgsResp)
        } else {
          const [clientsResp, suppliersResp] = await Promise.all([
            tryGet<any>("/api/v1/clients"),
            tryGet<any>("/api/v1/suppliers"),
          ])
          const cList = asArray<Organization>(clientsResp).map((c) => ({
            ...c,
            type: "CLIENT" as const,
          }))
          const sList = asArray<Organization>(suppliersResp).map((s) => ({
            ...s,
            type: "SUPPLIER" as const,
          }))
          orgsData = [...cList, ...sList]
        }

        // USUÁRIOS
        let usersList = asArray<User>(await tryGet<any>("/api/v1/users"))
        if (!usersList.length)
          usersList = asArray<User>(await tryGet<any>("/api/v1/accounts"))
        if (!usersList.length)
          usersList = [{ id: 1, name: "Admin", email: "admin@docflow" }]

        if (!abort) {
          setProjects(projs ?? [])
          setOrgs(orgsData ?? [])
          setUsers(usersList ?? [])

          const currentUsername = getAuthUsernameFromToken()
          console.log("[NewRequestPage] currentUsername do JWT:", currentUsername)
          console.log("[NewRequestPage] usersList:", usersList)

          let initialUser: User | undefined

          if (currentUsername) {
            const lowered = currentUsername.toLowerCase()
            initialUser =
              usersList.find(
                (u) =>
                  u.username?.toLowerCase() === lowered ||
                  u.email?.toLowerCase() === lowered ||
                  u.name?.toLowerCase() === lowered
              ) ?? usersList[0]
          } else {
            initialUser = usersList[0]
          }

          console.log("[NewRequestPage] initialUser escolhido:", initialUser)

          if (initialUser) {
            setRequestUserId(String(initialUser.id))
            setRequesterContact(
              initialUser.email || initialUser.username || ""
            )
          }
        }
      } catch (err: any) {
        if (!abort) {
          console.error(err)
          setErrorMsg("Falha ao carregar projetos/organizações.")
        }
      } finally {
        if (!abort) setIsBootLoading(false)
      }
    })()

    return () => {
      abort = true
    }
  }, [])

  /* ======================= Carregar detail + docs ======================= */
  useEffect(() => {
    if (!projectId) {
      setDocs([])
      setProjectDetail(null)
      setProjectSnapshot(null)
      return
    }
    let abort = false
    setIsDocsLoading(true)
    setErrorMsg(null)

    ;(async () => {
      try {
        const detail = await tryGet<ProjectDetail>(
          `/api/v1/projects/${projectId}/detail`
        )
        if (!detail) throw new Error("Sem detail")

        if (!abort) setProjectDetail(detail)

        // ---- map snapshot (status/datas/client/supplier/internal) ----
        const internal =
          detail.internalOrgId ??
          detail.ownerOrgId ??
          detail.organizationId ??
          null

        const client =
          detail.client?.id ??
          detail.customer?.id ??
          detail.clientId ??
          detail.organizationClientId ??
          null

        const supplier =
          detail.supplier?.id ??
          detail.vendor?.id ??
          detail.supplierId ??
          detail.organizationSupplierId ??
          null

        const snap = {
          id: detail.id ?? Number(projectId),
          code: detail.code,
          name: detail.name,
          status: detail.status,
          startDate: detail.startDate,
          plannedEndDate: detail.plannedEndDate,
          clientId: client ?? null,
          supplierId: supplier ?? null,
          internalOrgId: internal ?? null,
        }
        if (!abort) setProjectSnapshot(snap)

        // ---- documents ----
        const rawDocs: ProjectDocument[] =
          (detail as any)?.documents ??
          (detail as any)?.projectDocuments ??
          (detail as any)?.attachments ??
          (detail as any)?.files ??
          []

        const mapped: DocPick[] = (rawDocs || []).map((d: ProjectDocument) => ({
          id: d.id ?? (d.code || `DOC-${Math.random()}`),
          code: d.code || String(d.id ?? ""),
          name: d.title || d.name || "Documento sem nome",
          revision: d.revision ?? "-",
          projectId: Number(projectId),
          checked: false,
        }))
        if (!abort) setDocs(mapped)

        // ---- autopreencher solicitante/destinatário se vazio ----
        if (!abort) {
          if (!requesterOrgId) {
            if (internal) setRequesterOrgId(String(internal))
            else if (client) setRequesterOrgId(String(client))
          }
          if (!targetOrgId) {
            if (client && !supplier) setTargetOrgId(String(client))
            if (!client && supplier) setTargetOrgId(String(supplier))
          }
        }
      } catch (err) {
        if (!abort) {
          console.error(err)
          setErrorMsg(
            "Falha ao carregar detalhes/documentos do projeto selecionado."
          )
          setDocs([])
          setProjectDetail(null)
          setProjectSnapshot(null)
        }
      } finally {
        if (!abort) setIsDocsLoading(false)
      }
    })()

    return () => {
      abort = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  /* Auto-preencher contato ao trocar usuário */
  useEffect(() => {
    if (!requestUserId) return
    const u = users.find((x) => String(x.id) === String(requestUserId))
    setRequesterContact(u?.email || u?.username || "")
  }, [requestUserId, users])

  /* seleção de docs */
  const toggleDocument = (id: number | string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d))
    )
  }
  const selectedDocs = useMemo(
    () => docs.filter((d) => d.checked),
    [docs]
  )

  /* ======================= Submit ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !projectId ||
      !requestType ||
      !purpose.trim() ||
      !requesterOrgId ||
      !targetOrgId ||
      !requestUserId
    ) {
      setErrorMsg(
        "Preencha Projeto, Tipo, Propósito, Solicitante, Destinatário e Usuário solicitante."
      )
      return
    }

    setErrorMsg(null)
    setIsSubmitting(true)

    const metadata = {
      project: projectSnapshot,
      orgsResolved: {
        requesterOrgId: toNumOrNull(requesterOrgId),
        targetOrgId: toNumOrNull(targetOrgId),
      },
      requestType,
      priority,
      documents: selectedDocs.map((d) => ({
        id: Number(d.id),
        code: d.code,
        name: d.name,
        revision: d.revision,
      })),
    }

    const payload: any = {
      projectId: Number(projectId),
      purpose: purpose.trim(),
      description: description?.trim() || null,
      requesterOrgId: toNumOrNull(requesterOrgId),
      targetOrgId: toNumOrNull(targetOrgId),
      requesterUserId: Number(requestUserId),
      requesterContact: requesterContact?.trim() || null,
      requestDate: dateToISO(requestDate),
      desiredDeadline: deadline ? dateToISO(deadline) : null,
      justification: justification?.trim() || null,
      specialInstructions: specialInstructions?.trim() || null,
      documentIds: selectedDocs
        .map((d) => Number(d.id))
        .filter((n) => Number.isFinite(n)),
      metadataJson: JSON.stringify(metadata),
    }

    console.log("[requests/new] payload ->", payload)

    try {
      await RequestsApi.createRequest(payload)
      navigate("/requests")
    } catch (err) {
      console.error(err)
      setErrorMsg("Não foi possível criar a solicitação.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader
            title="Nova Solicitação"
            description="Crie uma nova solicitação de tramitação"
          >
            <Link to="/requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* INFO PRINCIPAIS */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Informações da Solicitação</CardTitle>
                <CardDescription>Dados principais da solicitação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="request-number">Número da Solicitação</Label>
                    <Input
                      id="request-number"
                      placeholder="Será gerado automaticamente"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Projeto *</Label>
                  <Select
                    value={projectId}
                    onValueChange={setProjectId}
                    disabled={isBootLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isBootLoading ? "Carregando..." : "Selecione o projeto"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.code ? `${p.code} — ${p.name}` : p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Status do Projeto</Label>
                    <Input value={projectSnapshot?.status ?? "-"} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input value={projectSnapshot?.startDate ?? "-"} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Previsão/Fim</Label>
                    <Input
                      value={projectSnapshot?.plannedEndDate ?? "-"}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Solicitação *</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEND_TO_CLIENT">
                        Envio para Cliente
                      </SelectItem>
                      <SelectItem value="SEND_TO_SUPPLIER">
                        Envio para Fornecedor
                      </SelectItem>
                      <SelectItem value="RECEIVE_FROM_CLIENT">
                        Retorno de Cliente
                      </SelectItem>
                      <SelectItem value="RECEIVE_FROM_SUPPLIER">
                        Retorno de Fornecedor
                      </SelectItem>
                      <SelectItem value="INTERNAL_APPROVAL">
                        Aprovação Interna
                      </SelectItem>
                      <SelectItem value="TECH_REVIEW">
                        Revisão Técnica
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Propósito *</Label>
                  <Input
                    placeholder="Ex.: Enviar GRD para aprovação do cliente"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição da Solicitação</Label>
                  <Textarea
                    placeholder="Descreva detalhadamente o que está sendo solicitado..."
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ORIGEM/DESTINO */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Origem e Destino</CardTitle>
                <CardDescription>
                  Defina quem está solicitando e para quem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Solicitante (Organização) *</Label>
                    <Select
                      value={requesterOrgId}
                      onValueChange={setRequesterOrgId}
                      disabled={isBootLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isBootLoading
                              ? "Carregando..."
                              : "Quem está solicitando"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Interno</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} (Cliente)
                          </SelectItem>
                        ))}
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name} (Fornecedor)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Destinatário (Organização) *</Label>
                    <Select
                      value={targetOrgId}
                      onValueChange={setTargetOrgId}
                      disabled={isBootLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isBootLoading
                              ? "Carregando..."
                              : "Para quem é a solicitação"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Interno</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} (Cliente)
                          </SelectItem>
                        ))}
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name} (Fornecedor)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Usuário solicitante *</Label>
                    <Select
                      value={requestUserId}
                      onValueChange={setRequestUserId}
                      disabled={isBootLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isBootLoading
                              ? "Carregando..."
                              : "Selecione o usuário"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name || u.username || `ID ${u.id}`}{" "}
                            {u.email ? `— ${u.email}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requester-contact">
                      Contato do Solicitante (auto)
                    </Label>
                    <Input
                      id="requester-contact"
                      placeholder="email do usuário"
                      value={requesterContact}
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DOCUMENTOS */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Documentos Relacionados</CardTitle>
                <CardDescription>
                  Selecione os documentos relacionados a esta solicitação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(!projectId || isDocsLoading) && (
                  <div className="text-sm text-muted-foreground">
                    {isDocsLoading
                      ? "Carregando documentos..."
                      : "Selecione um projeto para listar os documentos."}
                  </div>
                )}
                {projectId && !isDocsLoading && docs.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Nenhum documento encontrado para o projeto selecionado.
                  </div>
                )}
                {docs.length > 0 && (
                  <>
                    <div className="space-y-4">
                      {docs.map((doc) => (
                        <div
                          key={String(doc.id)}
                          className="flex items-center justify-between border rounded-lg p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={`doc-${String(doc.id)}`}
                              checked={doc.checked}
                              onCheckedChange={() => toggleDocument(doc.id)}
                            />
                            <div>
                              <Label
                                htmlFor={`doc-${String(doc.id)}`}
                                className="font-medium"
                              >
                                {doc.code} — {doc.name}
                              </Label>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {doc.revision ? `Rev. ${doc.revision}` : "Rev. −"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {docs.filter((d) => d.checked).length} documento(s)
                      selecionado(s)
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* PRAZOS E DETALHES */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Prazos e Detalhes</CardTitle>
                <CardDescription>
                  Defina prazos e informações adicionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="request-date">Data da Solicitação</Label>
                    <Input
                      id="request-date"
                      type="date"
                      value={requestDate}
                      onChange={(e) => setRequestDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Prazo Desejado</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justification">Justificativa</Label>
                  <Textarea
                    id="justification"
                    placeholder="Justifique a necessidade desta solicitação..."
                    className="min-h-[80px]"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="special-instructions">
                    Instruções Especiais
                  </Label>
                  <Textarea
                    id="special-instructions"
                    placeholder="Instruções específicas, cuidados especiais, etc..."
                    className="min-h-[80px]"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {errorMsg && (
              <div className="text-sm text-red-500">{errorMsg}</div>
            )}

            <div className="flex justify-end gap-4">
              <Link to="/requests">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Criando..."
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Criar Solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
