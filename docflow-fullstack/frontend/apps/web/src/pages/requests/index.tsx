// src/pages/requests/index.tsx
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { MoreHorizontal, Plus, Search, Eye, UserCheck, X, Filter as FilterIcon } from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

import {
  listRequestsManyStatuses,
  REQUEST_STATUS_GROUPS,
  type RequestSummary,
  type RequestStatus,
  type Page,
} from "@/services/requests"

type TabKey = "pending" | "completed"

// pequeno hook de debounce (igual usamos em outras páginas)
function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/** Campos disponíveis para busca/filtragem (espelham as colunas da tabela) */
const FILTER_OPTIONS = [
  { key: "number", label: "Número" },
  { key: "projectName", label: "Projeto" },
  { key: "originName", label: "Origem" },
  { key: "targetName", label: "Destino" },
  { key: "purpose", label: "Propósito" },
  { key: "documents", label: "Documentos" },
  { key: "requestDate", label: "Data" },
  { key: "status", label: "Status" },
] as const

type FilterKey = typeof FILTER_OPTIONS[number]["key"]

export default function RequestsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // aba & query vindas da URL
  const urlTab = (searchParams.get("tab") as TabKey) || "pending"
  const [activeTab, setActiveTab] = useState<TabKey>(urlTab)

  const urlQ = searchParams.get("q") || ""
  const [q, setQ] = useState(urlQ)
  const debouncedQ = useDebounced(q, 400)

  // >>> filtros: múltipla seleção (como em clients/documents)
  const ALL_FIELDS = FILTER_OPTIONS.map((o) => o.key) as FilterKey[]
  const [selectedFields, setSelectedFields] = useState<FilterKey[]>(ALL_FIELDS)

  // UI/data state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [page, setPage] = useState<Page<RequestSummary> | null>(null)

  // seleção (apenas pendentes)
  const [selectedRequests, setSelectedRequests] = useState<number[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // grupos de status por aba
  const statuses: RequestStatus[] = useMemo(
    () => (activeTab === "pending" ? REQUEST_STATUS_GROUPS.pending : REQUEST_STATUS_GROUPS.done),
    [activeTab]
  )

  // sincroniza aba/query -> URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", activeTab)
    if (q?.trim()) params.set("q", q.trim())
    else params.delete("q")
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, q])

  // carregamento (usa q com debounce para não sobrecarregar o backend)
  const load = async (p = 0) => {
    setLoading(true)
    setError(null)
    try {
      const resp = await listRequestsManyStatuses({
        q: debouncedQ?.trim() || undefined,
        statuses,
        page: p,
        size: pageSize,
        sort: "requestDate,desc",
        // Se seu serviço aceitar, também enviamos os campos selecionados:
        
        fields: selectedFields.join(","),
      } as any)
      setPage(resp)
      setPageIndex(p)
      if (activeTab !== "pending") setSelectedRequests([])
    } catch (err) {
      console.error(err)
      setError("Falha ao carregar solicitações.")
    } finally {
      setLoading(false)
    }
  }

  // recarrega quando: aba muda, pageSize muda (fixo aqui), q (debounced) muda, ou filtros mudam
  useEffect(() => {
    load(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, pageSize, debouncedQ, selectedFields])

  const onSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") load(0) // opção manual, além do debounce
  }

  // status badge
  const StatusBadge = ({ s }: { s: RequestStatus }) => {
    const label =
      s === "PENDING"
        ? "Pendente"
        : s === "IN_PROGRESS"
        ? "Em análise"
        : s === "COMPLETED"
        ? "Concluída"
        : s === "REJECTED"
        ? "Rejeitada"
        : "Cancelada"

    const variant =
      s === "PENDING"
        ? "outline"
        : s === "IN_PROGRESS"
        ? "secondary"
        : s === "COMPLETED"
        ? "default"
        : s === "REJECTED"
        ? "destructive"
        : "secondary"

    return <Badge variant={variant as any}>{label}</Badge>
  }

  const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—")

  // --- filtragem local adicional com base nos campos selecionados ---
  const normalize = (v: unknown) =>
    (v ?? "").toString().toLowerCase()

  const fieldValue = (r: RequestSummary, key: FilterKey): string => {
    switch (key) {
      case "number": return normalize(r.number)
      case "projectName": return normalize(r.projectName)
      case "originName": return normalize(r.originName)
      case "targetName": return normalize(r.targetName)
      case "purpose": return normalize(r.purpose)
      case "documents": return normalize(r.documents)
      case "requestDate": return normalize(r.requestDate ? new Date(r.requestDate).toLocaleDateString() : "")
      case "status": {
        const s = r.status
        const label =
          s === "PENDING" ? "pendente" :
          s === "IN_PROGRESS" ? "em análise" :
          s === "COMPLETED" ? "concluída" :
          s === "REJECTED" ? "rejeitada" :
          "cancelada"
        return `${normalize(s)} ${label}`
      }
    }
  }

  const applyLocalFilter = (rows: RequestSummary[]): RequestSummary[] => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    const fields = selectedFields.length ? selectedFields : ALL_FIELDS
    return rows.filter(r =>
      fields.some(f => fieldValue(r, f).includes(query))
    )
  }

  // seleção (apenas pendentes) — agora baseada nas linhas *visíveis* (filtradas)
  const pendingAllRows = useMemo(
    () => (activeTab === "pending" ? page?.content ?? [] : []),
    [activeTab, page]
  )
  const pendingRows = useMemo(() => applyLocalFilter(pendingAllRows), [pendingAllRows, q, selectedFields])

  const doneAllRows = useMemo(
    () => (activeTab === "completed" ? page?.content ?? [] : []),
    [activeTab, page]
  )
  const doneRows = useMemo(() => applyLocalFilter(doneAllRows), [doneAllRows, q, selectedFields])

  const handleSelectOne = (id: number) => {
    setSelectedRequests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }
  const handleSelectAll = () => {
    if (!pendingRows.length) return
    if (selectedRequests.length === pendingRows.length) setSelectedRequests([])
    else setSelectedRequests(pendingRows.map((r) => r.id))
  }

  const handleAttendRequests = async () => {
    if (!selectedRequests.length) return
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      navigate(`/requests/attend?ids=${selectedRequests.join(",")}`)
    }, 500)
  }

  // helpers de filtro: manter menu aberto ao marcar
  const toggleField = (key: FilterKey, checked: boolean) => {
    setSelectedFields((prev) => {
      if (checked) {
        if (prev.includes(key)) return prev
        return [...prev, key]
      }
      return prev.filter((k) => k !== key)
    })
  }
  const clearAll = () => setSelectedFields([])
  const selectAll = () => setSelectedFields(ALL_FIELDS)

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader title="Solicitações" description="Gerencie solicitações de tramitação de documentos">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar solicitações..."
                  className="w-full md:w-[300px] pl-8 pr-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onSearchEnter}
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-2.5 top-2.5 p-0.5 rounded hover:bg-muted"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Filtros (múltipla seleção, com limpar/selecionar tudo; menu não fecha ao marcar) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <FilterIcon className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTER_OPTIONS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.key}
                      checked={selectedFields.includes(opt.key)}
                      onSelect={(e) => e.preventDefault()}            // mantém o menu aberto
                      onCheckedChange={(c) => toggleField(opt.key, Boolean(c))}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Limpar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={selectedFields.length === ALL_FIELDS.length}
                    >
                      Selecionar tudo
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/requests/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Solicitação
                </Button>
              </Link>
            </div>
          </PageHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabKey)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="pending">Ativas</TabsTrigger>
              <TabsTrigger value="completed">Finalizadas</TabsTrigger>
            </TabsList>

            {/* PENDENTES */}
            <TabsContent value="pending">
              <Card className="neon-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Solicitações Pendentes</CardTitle>
                      <CardDescription>Solicitações que aguardam análise ou aprovação</CardDescription>
                    </div>
                    {selectedRequests.length > 0 && (
                      <Button onClick={handleAttendRequests} disabled={isProcessing} className="neon-border" size="sm">
                        <UserCheck className="mr-2 h-4 w-4" />
                        {isProcessing
                          ? "Processando..."
                          : `Atender ${selectedRequests.length} Solicitaç${
                              selectedRequests.length === 1 ? "ão" : "ões"
                            }`}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {error && <div className="mb-2 text-sm text-red-500">{error}</div>}
                  {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}

                  {!loading && (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={
                                  pendingRows.length > 0 &&
                                  selectedRequests.length === pendingRows.length
                                }
                                onCheckedChange={handleSelectAll}
                                aria-label="Selecionar todas"
                              />
                            </TableHead>
                            <TableHead>Número</TableHead>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Propósito</TableHead>
                            <TableHead>Documentos</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingRows.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedRequests.includes(r.id)}
                                  onCheckedChange={() => handleSelectOne(r.id)}
                                  aria-label={`Selecionar ${r.number}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{r.number}</TableCell>
                              <TableCell>{r.projectName ?? "—"}</TableCell>
                              <TableCell>{r.originName ?? "—"}</TableCell>
                              <TableCell>{r.targetName ?? "—"}</TableCell>
                              <TableCell>{r.purpose ?? "—"}</TableCell>
                              <TableCell>{r.documents ?? 0}</TableCell>
                              <TableCell>{fmtDate(r.requestDate)}</TableCell>
                              <TableCell><StatusBadge s={r.status} /></TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Abrir menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Link to={`/requests/${r.id}`} className="flex w-full">
                                        Ver detalhes
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {pendingRows.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma solicitação pendente encontrada.
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CONCLUÍDAS */}
            <TabsContent value="completed">
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Solicitações Concluídas</CardTitle>
                  <CardDescription>Solicitações que já foram processadas e concluídas</CardDescription>
                </CardHeader>
                <CardContent>
                  {error && <div className="mb-2 text-sm text-red-500">{error}</div>}
                  {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}

                  {!loading && (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead>Destino</TableHead>
                            <TableHead>Propósito</TableHead>
                            <TableHead>GRD</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doneRows.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.number}</TableCell>
                              <TableCell>{r.projectName ?? "—"}</TableCell>
                              <TableCell>{r.originName ?? "—"}</TableCell>
                              <TableCell>{r.targetName ?? "—"}</TableCell>
                              <TableCell>{r.purpose ?? "—"}</TableCell>
                              <TableCell>
                                <Link
                                  to={`/documents/routing/${r.id}/grd`}
                                  className="flex items-center gap-1 text-primary hover:underline neon-text"
                                >
                                  Ver GRD
                                  <Eye className="h-3 w-3" />
                                </Link>
                              </TableCell>
                              <TableCell>{fmtDate(r.requestDate)}</TableCell>
                              <TableCell><StatusBadge s={r.status} /></TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Abrir menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Link to={`/requests/${r.id}`} className="flex w-full">
                                        Ver detalhes
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {doneRows.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma solicitação concluída encontrada.
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
