// src/pages/mensageria/index.tsx
import { useMemo, useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Search,
  Filter as FilterIcon,
  MoreHorizontal,
  RefreshCw,
  FileText,
  ExternalLink,
  ClipboardList,
  Eye,
  X,
  Plus,
} from "lucide-react"

/* ================== Tipos ================== */
type ESocialStatus = "PROCESSING" | "SENT" | "APPROVED" | "ERROR" | "CANCELLED"
type Ambiente = "PRODUCAO" | "HOMOLOG"

type MensageriaItem = {
  id: number
  empresa: string
  cnpj: string
  projeto?: string | null
  tipoEvento: string // e.g., S-1000, S-1200...
  descricao: string
  status: ESocialStatus
  protocolo?: string | null
  recibo?: string | null
  lote?: string | null
  ambiente: Ambiente
  criadoEm: string // ISO
  atualizadoEm?: string | null // ISO
}

/* ================== Mock ================== */
const MOCK: MensageriaItem[] = [
  {
    id: 1,
    empresa: "Empresa ABC",
    cnpj: "12.345.678/0001-99",
    projeto: "Projeto Alpha",
    tipoEvento: "S-1000",
    descricao: "Informações do Empregador/Contribuinte",
    status: "APPROVED",
    protocolo: "PRT-2025-000123",
    recibo: "RCB-7711AA",
    lote: "L-000045",
    ambiente: "PRODUCAO",
    criadoEm: "2025-05-10T10:12:00Z",
    atualizadoEm: "2025-05-10T10:14:30Z",
  },
  {
    id: 2,
    empresa: "Construtora XYZ",
    cnpj: "98.765.432/0001-11",
    projeto: "Expansão Sede",
    tipoEvento: "S-1010",
    descricao: "Tabela de Rubricas - inclusão",
    status: "SENT",
    protocolo: "PRT-2025-000789",
    recibo: null,
    lote: "L-000051",
    ambiente: "HOMOLOG",
    criadoEm: "2025-05-11T13:40:00Z",
    atualizadoEm: "2025-05-11T13:41:00Z",
  },
  {
    id: 3,
    empresa: "Indústria 123",
    cnpj: "44.222.111/0001-55",
    projeto: "Reforma Unidade 3",
    tipoEvento: "S-1200",
    descricao: "Remuneração de trabalhador (competência 04/2025)",
    status: "ERROR",
    protocolo: "PRT-2025-000992",
    recibo: null,
    lote: "L-000061",
    ambiente: "PRODUCAO",
    criadoEm: "2025-05-12T08:05:00Z",
    atualizadoEm: "2025-05-12T08:06:12Z",
  },
  {
    id: 4,
    empresa: "Empresa ABC",
    cnpj: "12.345.678/0001-99",
    projeto: "Projeto Alpha",
    tipoEvento: "S-1210",
    descricao: "Pagamentos de rendimentos do trabalho",
    status: "PROCESSING",
    protocolo: "PRT-2025-001003",
    recibo: null,
    lote: "L-000062",
    ambiente: "PRODUCAO",
    criadoEm: "2025-05-12T09:20:00Z",
    atualizadoEm: null,
  },
  {
    id: 5,
    empresa: "DocScriptum",
    cnpj: "00.000.000/0001-00",
    projeto: null,
    tipoEvento: "S-2230",
    descricao: "Afastamento temporário - inclusão",
    status: "SENT",
    protocolo: "PRT-2025-001055",
    recibo: "RCB-9922FF",
    lote: "L-000064",
    ambiente: "HOMOLOG",
    criadoEm: "2025-05-12T12:00:00Z",
    atualizadoEm: "2025-05-12T12:03:55Z",
  },
]

/* ================== Utils ================== */
const FILTER_OPTIONS = [
  { key: "empresa", label: "Empresa" },
  { key: "cnpj", label: "CNPJ" },
  { key: "projeto", label: "Projeto" },
  { key: "tipo", label: "Tipo (S-*)" },
  { key: "status", label: "Status" },
  { key: "protocolo", label: "Protocolo/Recibo/Lote" },
  { key: "ambiente", label: "Ambiente" },
  { key: "descricao", label: "Descrição" },
] as const
type FilterKey = typeof FILTER_OPTIONS[number]["key"]

function norm(s: string | null | undefined) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
}

function statusBadgeVariant(s: ESocialStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "APPROVED":
      return "default"
    case "SENT":
    case "PROCESSING":
      return "secondary"
    case "ERROR":
      return "destructive"
    case "CANCELLED":
      return "outline"
  }
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString()
}

/* ================== Debounce simples ================== */
function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

/* ================== Página ================== */
export default function MensageriaPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const urlTab = (searchParams.get("tab") as "all" | "errors" | "processing" | "approved") || "all"
  const [activeTab, setActiveTab] = useState<"all" | "errors" | "processing" | "approved">(urlTab)

  const urlQ = searchParams.get("q") || ""
  const [q, setQ] = useState(urlQ)
  const debouncedQ = useDebounced(q, 400)

  const ALL_FIELDS = FILTER_OPTIONS.map(o => o.key) as FilterKey[]
  const [selectedFields, setSelectedFields] = useState<FilterKey[]>(ALL_FIELDS)

  // sync tab/query -> URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set("tab", activeTab)
    if (q?.trim()) params.set("q", q.trim())
    else params.delete("q")
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, q])

  // dataset conforme tab
  const rowsByTab = useMemo(() => {
    switch (activeTab) {
      case "errors":
        return MOCK.filter(r => r.status === "ERROR")
      case "processing":
        return MOCK.filter(r => r.status === "PROCESSING" || r.status === "SENT")
      case "approved":
        return MOCK.filter(r => r.status === "APPROVED")
      case "all":
      default:
        return MOCK
    }
  }, [activeTab])

  const fieldValue = (r: MensageriaItem, key: FilterKey) => {
    switch (key) {
      case "empresa": return norm(r.empresa)
      case "cnpj": return norm(r.cnpj)
      case "projeto": return norm(r.projeto)
      case "tipo": return norm(r.tipoEvento)
      case "status": return norm(r.status)
      case "protocolo": return norm(`${r.protocolo ?? ""} ${r.recibo ?? ""} ${r.lote ?? ""}`)
      case "ambiente": return norm(r.ambiente === "PRODUCAO" ? "producao" : "homolog")
      case "descricao": return norm(r.descricao)
    }
  }

  const filteredRows = useMemo(() => {
    const nq = norm(debouncedQ)
    if (!nq) return rowsByTab
    const fields = selectedFields.length ? selectedFields : ALL_FIELDS
    return rowsByTab.filter(r => fields.some(f => fieldValue(r, f).includes(nq)))
  }, [rowsByTab, debouncedQ, selectedFields])

  const toggleField = (key: FilterKey, checked: boolean) => {
    setSelectedFields(prev => (checked ? [...new Set([...prev, key])] : prev.filter(k => k !== key)))
  }

  const handleEnterSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // nada assíncrono aqui; o debounce já atualiza
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader
            title="Mensageria"
            description="Monitore os eventos do eSocial (envios, retornos, erros e aprovações)"
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full">
              {/* Busca */}
              <div className="relative w-full sm:w-[340px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por empresa, tipo (S-*), status, protocolo..."
                  className="pl-8 pr-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={handleEnterSearch}
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

              {/* Filtros (campos) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FilterIcon className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Campos considerados na busca</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTER_OPTIONS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.key}
                      checked={selectedFields.includes(opt.key)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(c) => toggleField(opt.key, Boolean(c))}
                    >
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Dica: você pode digitar “S-1200 aprovado producao” para filtrar rápido.
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Criar manualmente (mock) */}
              <Button variant="outline" onClick={() => navigate("/mensageria/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Novo envio
              </Button>
            </div>
          </PageHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="processing">Em envio/Process.</TabsTrigger>
              <TabsTrigger value="approved">Aprovados</TabsTrigger>
              <TabsTrigger value="errors">Com erro</TabsTrigger>
            </TabsList>

            <TabsContent value="all"><MensageriaTable rows={filteredRows} /></TabsContent>
            <TabsContent value="processing"><MensageriaTable rows={filteredRows} /></TabsContent>
            <TabsContent value="approved"><MensageriaTable rows={filteredRows} /></TabsContent>
            <TabsContent value="errors"><MensageriaTable rows={filteredRows} /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

/* ================== Tabela reutilizável ================== */
function MensageriaTable({ rows }: { rows: MensageriaItem[] }) {
  return (
    <Card className="neon-border">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">Fila de eventos eSocial</CardTitle>
        <CardDescription className="text-sm">
          Acompanhe status, protocolos/recibos e ações por evento
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[130px]">Empresa</TableHead>
              <TableHead className="hidden lg:table-cell w-[140px]">Projeto</TableHead>
              <TableHead className="w-[92px]">Evento</TableHead>
              <TableHead className="hidden md:table-cell">Descrição</TableHead>
              <TableHead className="w-[110px]">Ambiente</TableHead>
              <TableHead className="w-[110px]">Status</TableHead>
              <TableHead className="hidden xl:table-cell w-[160px]">Protoc./Recibo/Lote</TableHead>
              <TableHead className="hidden xl:table-cell w-[160px]">Atualizado</TableHead>
              <TableHead className="text-right w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="align-top">
                <TableCell className="leading-tight">
                  <div className="font-medium truncate">{r.empresa}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.cnpj}</div>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  {r.projeto ?? "—"}
                </TableCell>

                <TableCell>
                  <div className="font-medium">{r.tipoEvento}</div>
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <div className="truncate">{r.descricao}</div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">
                    {r.ambiente === "PRODUCAO" ? "Produção" : "Homologação"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={statusBadgeVariant(r.status)}>{labelStatus(r.status)}</Badge>
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                  <div className="text-xs leading-tight">
                    <div><span className="text-muted-foreground">Prot.:</span> {r.protocolo ?? "—"}</div>
                    <div><span className="text-muted-foreground">Rec.:</span> {r.recibo ?? "—"}</div>
                    <div><span className="text-muted-foreground">Lote:</span> {r.lote ?? "—"}</div>
                  </div>
                </TableCell>

                <TableCell className="hidden xl:table-cell">
                  {fmtDate(r.atualizadoEm ?? r.criadoEm)}
                </TableCell>

                <TableCell className="text-right">
                  <RowActions id={r.id} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  Nenhum evento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function labelStatus(s: ESocialStatus) {
  switch (s) {
    case "PROCESSING": return "Processando"
    case "SENT": return "Enviado"
    case "APPROVED": return "Aprovado"
    case "ERROR": return "Erro"
    case "CANCELLED": return "Cancelado"
  }
}

function RowActions({ id }: { id: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/mensageria/${id}`}><Eye className="mr-2 h-4 w-4" /> Ver detalhes</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/mensageria/${id}/xml`}><FileText className="mr-2 h-4 w-4" /> Ver XML</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/mensageria/${id}/retorno`}><ClipboardList className="mr-2 h-4 w-4" /> Ver retorno</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/mensageria/${id}/reprocess`}><RefreshCw className="mr-2 h-4 w-4" /> Reprocessar</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`#`}><ExternalLink className="mr-2 h-4 w-4" /> Abrir no sistema do cliente</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
