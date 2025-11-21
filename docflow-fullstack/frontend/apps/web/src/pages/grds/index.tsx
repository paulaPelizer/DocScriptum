import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Search,
  Printer,
  Filter as FilterIcon,
  X,
  Eye,
  Download,
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"

type Direction = "to-client" | "from-client" | "to-supplier" | "from-supplier"
type TabValue = "all" | Direction

type GRD = {
  id: number
  grdNumber: string
  project: string
  origin: string
  destination: string
  direction: Direction
  documentsCount: number
  date: string
  status: "Concluída" | "Em elaboração" | "Cancelada"
}

const FILTER_OPTIONS = [
  { key: "grdNumber", label: "Número" },
  { key: "project", label: "Projeto" },
  { key: "origin", label: "Origem" },
  { key: "destination", label: "Destino" },
  { key: "direction", label: "Direção" },
  { key: "documentsCount", label: "Qtd. Docs" },
  { key: "date", label: "Data" },
  { key: "status", label: "Status" },
] as const

type FilterKey = (typeof FILTER_OPTIONS)[number]["key"]

export default function GRDsPage() {
  // === Dados mokados alinhados à categoria “Gestão de Documentos e Protocolo” da TTD ===
  const grds: GRD[] = [
    {
      id: 1,
      grdNumber: "GRD-ABC-XYZ-2025001",
      project: "Projeto Alpha – Subestação 230kV",
      origin: "Empresa ABC (Cliente)",
      destination: "Construtora XYZ (Fornecedor)",
      direction: "to-supplier",
      documentsCount: 3,
      date: "10/05/2025",
      status: "Concluída",
    },
    {
      id: 2,
      grdNumber: "GRD-XYZ-ABC-2025001",
      project: "Expansão Sede – Prédio Administrativo",
      origin: "Construtora XYZ (Fornecedor)",
      destination: "Empresa ABC (Cliente)",
      direction: "from-supplier",
      documentsCount: 2,
      date: "08/05/2025",
      status: "Concluída",
    },
    {
      id: 3,
      grdNumber: "GRD-IND-XYZ-2025001",
      project: "Reforma Unidade 3 – Adequação Elétrica",
      origin: "Indústria 123 (Cliente)",
      destination: "Construtora XYZ (Fornecedor)",
      direction: "to-supplier",
      documentsCount: 5,
      date: "05/05/2025",
      status: "Concluída",
    },
    {
      id: 4,
      grdNumber: "GRD-INT-DEF-2025001",
      project: "Projeto Beta – Linha de Transmissão",
      origin: "Interno",
      destination: "Empresa DEF (Cliente)",
      direction: "to-client",
      documentsCount: 4,
      date: "03/05/2025",
      status: "Concluída",
    },
    {
      id: 5,
      grdNumber: "GRD-ABC-XYZ-2025002",
      project: "Projeto Alpha – Subestação 230kV",
      origin: "Empresa ABC (Cliente)",
      destination: "Construtora XYZ (Fornecedor)",
      direction: "to-supplier",
      documentsCount: 2,
      date: "01/05/2025",
      status: "Concluída",
    },
    {
      id: 6,
      grdNumber: "GRD-MAN-IND-2025001",
      project: "Modernização Planta – Linha de Produção",
      origin: "Manufatura ABC (Fornecedor)",
      destination: "Indústria XYZ (Cliente)",
      direction: "from-supplier",
      documentsCount: 1,
      date: "28/04/2025",
      status: "Concluída",
    },
  ]

  // === Busca e filtros ===
  const [q, setQ] = useState("")
  const ALL_FIELDS = FILTER_OPTIONS.map((o) => o.key) as FilterKey[]
  const [selectedFields, setSelectedFields] = useState<FilterKey[]>(ALL_FIELDS)
  const [tab, setTab] = useState<TabValue>("all")

  const normalize = (v: unknown) => (v ?? "").toString().toLowerCase()

  const fieldValue = (r: GRD, key: FilterKey): string => {
    switch (key) {
      case "grdNumber":
        return normalize(r.grdNumber)
      case "project":
        return normalize(r.project)
      case "origin":
        return normalize(r.origin)
      case "destination":
        return normalize(r.destination)
      case "direction": {
        const map: Record<Direction, string> = {
          "to-client": "para cliente",
          "from-client": "de cliente",
          "to-supplier": "para fornecedor",
          "from-supplier": "de fornecedor",
        }
        return `${normalize(r.direction)} ${map[r.direction]}`
      }
      case "documentsCount":
        return normalize(r.documentsCount)
      case "date":
        return normalize(r.date)
      case "status":
        return normalize(r.status)
    }
  }

  const filteredByTab = useMemo(() => {
    if (tab === "all") return grds
    return grds.filter((g) => g.direction === tab)
  }, [grds, tab])

  const visibleRows = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return filteredByTab
    const fields = selectedFields.length ? selectedFields : ALL_FIELDS
    return filteredByTab.filter((row) => fields.some((f) => fieldValue(row, f).includes(query)))
  }, [filteredByTab, q, selectedFields])

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

  // KPIs simples
  const total = grds.length
  const totalToClient = grds.filter((g) => g.direction === "to-client").length
  const totalFromClient = grds.filter((g) => g.direction === "from-client").length
  const totalToSupplier = grds.filter((g) => g.direction === "to-supplier").length
  const totalFromSupplier = grds.filter((g) => g.direction === "from-supplier").length
  const totalDocs = grds.reduce((acc, g) => acc + g.documentsCount, 0)

  const renderTable = () => (
    <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Registro de GRDs</CardTitle>
        <CardDescription>
          Todas as Guias de Remessa de Documentação associadas aos projetos de engenharia e TI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Direção</TableHead>
              <TableHead className="text-center">Qtd. Docs</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((grd) => (
              <TableRow key={grd.id}>
                <TableCell className="font-medium">{grd.grdNumber}</TableCell>
                <TableCell>{grd.project}</TableCell>
                <TableCell>{grd.origin}</TableCell>
                <TableCell>{grd.destination}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      grd.direction === "to-client" && "border-sky-500 text-sky-500",
                      grd.direction === "from-client" && "border-emerald-500 text-emerald-500",
                      grd.direction === "to-supplier" && "border-purple-500 text-purple-500",
                      grd.direction === "from-supplier" && "border-pink-500 text-pink-500",
                    )}
                  >
                    {grd.direction === "to-client"
                      ? "Para Cliente"
                      : grd.direction === "from-client"
                      ? "De Cliente"
                      : grd.direction === "to-supplier"
                      ? "Para Fornecedor"
                      : "De Fornecedor"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{grd.documentsCount}</TableCell>
                <TableCell>{grd.date}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      grd.status === "Concluída"
                        ? "default"
                        : grd.status === "Em elaboração"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {grd.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/documents/routing/${grd.id}/grd`} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Visualizar GRD
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="#" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Exportar PDF
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="#" className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          Imprimir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/requests/${grd.id}`} className="flex items-center gap-2">
                          Ver Solicitação
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                  Nenhuma GRD encontrada para os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <p className="mt-4 text-xs text-muted-foreground">
          Categoria arquivística: <strong>Gestão de Documentos e Protocolo</strong> · Regra
          de temporalidade (exemplo DOCScriptum):{" "}
          <strong>5 anos corrente + 5 anos intermediário</strong> · Destinação:{" "}
          <strong>Eliminação / Permanente</strong> conforme TTD APESP — Protocolo e CONARQ
          Res. 46/2020.
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader
            title="Guias de Remessa de Documentação (GRDs)"
            description="Painel de consulta às GRDs emitidas, direções de envio e aderência à tabela de temporalidade de protocolo."
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full">
              {/* Busca */}
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por número, projeto, origem..."
                  className="w-full pl-8 pr-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
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

              {/* Filtros */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
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

              {/* Botão de relatório/sumário (apenas saída, sem ação de edição) */}
              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Relatório síntese
              </Button>
            </div>
          </PageHeader>

          {/* KPIs em estilo “vidro” igual ao Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GRDs Emitidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground">
                  Total de guias registradas no período
                </p>
              </CardContent>
            </Card>

            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Para Cliente / De Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalToClient} / {totalFromClient}
                </div>
                <p className="text-xs text-muted-foreground">
                  Movimentações entre empresa e clientes
                </p>
              </CardContent>
            </Card>

            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Para Fornecedor / De Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalToSupplier} / {totalFromSupplier}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trâmites com fornecedores de engenharia/TI
                </p>
              </CardContent>
            </Card>

            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos Tramitados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDocs}</div>
                <p className="text-xs text-muted-foreground">
                  Soma de documentos controlados via GRD
                </p>
              </CardContent>
            </Card>

            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100%</div>
                <p className="text-xs text-muted-foreground">
                  GRDs concluídas neste recorte (mock)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de direção, mas todas reutilizam a mesma tabela filtrada pelo state `tab` */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabValue)}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="to-client">Para Cliente</TabsTrigger>
              <TabsTrigger value="from-client">De Cliente</TabsTrigger>
              <TabsTrigger value="to-supplier">Para Fornecedor</TabsTrigger>
              <TabsTrigger value="from-supplier">De Fornecedor</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {renderTable()}
            </TabsContent>
            <TabsContent value="to-client" className="space-y-4">
              {renderTable()}
            </TabsContent>
            <TabsContent value="from-client" className="space-y-4">
              {renderTable()}
            </TabsContent>
            <TabsContent value="to-supplier" className="space-y-4">
              {renderTable()}
            </TabsContent>
            <TabsContent value="from-supplier" className="space-y-4">
              {renderTable()}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
