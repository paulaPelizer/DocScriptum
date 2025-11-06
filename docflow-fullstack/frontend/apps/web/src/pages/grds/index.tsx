import { useMemo, useState } from "react"
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
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Eye, Download, Printer, Filter as FilterIcon, X } from "lucide-react"
import { Link } from "react-router-dom"
import { MainNav } from "@/components/main-nav"
import { PageHeader } from "@/components/page-header"

type Direction = "to-client" | "from-client" | "to-supplier" | "from-supplier"

type GRD = {
  id: number
  grdNumber: string
  project: string
  origin: string
  destination: string
  direction: Direction
  documentsCount: number
  date: string
  status: string
}

const FILTER_OPTIONS = [
  { key: "grdNumber", label: "Número" },
  { key: "project", label: "Projeto" },
  { key: "origin", label: "Origem" },
  { key: "destination", label: "Destino" },
  { key: "direction", label: "Direção" },
  { key: "documentsCount", label: "Documentos" },
  { key: "date", label: "Data" },
  { key: "status", label: "Status" },
] as const
type FilterKey = typeof FILTER_OPTIONS[number]["key"]

export default function GRDsPage() {
  const grds: GRD[] = [
    { id: 1, grdNumber: "GRD-ABC-XYZ-2025001", project: "Projeto Alpha", origin: "Empresa ABC (Cliente)", destination: "Construtora XYZ (Fornecedor)", direction: "to-supplier", documentsCount: 3, date: "10/05/2025", status: "Concluída" },
    { id: 2, grdNumber: "GRD-XYZ-ABC-2025001", project: "Expansão Sede", origin: "Construtora XYZ (Fornecedor)", destination: "Empresa ABC (Cliente)", direction: "from-supplier", documentsCount: 2, date: "08/05/2025", status: "Concluída" },
    { id: 3, grdNumber: "GRD-IND-XYZ-2025001", project: "Reforma Unidade 3", origin: "Indústria 123 (Cliente)", destination: "Construtora XYZ (Fornecedor)", direction: "to-supplier", documentsCount: 5, date: "05/05/2025", status: "Concluída" },
    { id: 4, grdNumber: "GRD-INT-DEF-2025001", project: "Projeto Beta", origin: "Interno", destination: "Empresa DEF (Cliente)", direction: "to-client", documentsCount: 4, date: "03/05/2025", status: "Concluída" },
    { id: 5, grdNumber: "GRD-ABC-XYZ-2025002", project: "Projeto Alpha", origin: "Empresa ABC (Cliente)", destination: "Construtora XYZ (Fornecedor)", direction: "to-supplier", documentsCount: 2, date: "01/05/2025", status: "Concluída" },
    { id: 6, grdNumber: "GRD-MAN-IND-2025001", project: "Modernização Planta", origin: "Manufatura ABC (Fornecedor)", destination: "Indústria XYZ (Cliente)", direction: "from-supplier", documentsCount: 1, date: "28/04/2025", status: "Concluída" },
  ]

  // Busca + filtros (mesma UX das outras telas)
  const [q, setQ] = useState("")
  const ALL_FIELDS = FILTER_OPTIONS.map(o => o.key) as FilterKey[]
  const [selectedFields, setSelectedFields] = useState<FilterKey[]>(ALL_FIELDS)
  const [tab, setTab] = useState<"all" | Direction>("all")

  const normalize = (v: unknown) => (v ?? "").toString().toLowerCase()
  const fieldValue = (r: GRD, key: FilterKey): string => {
    switch (key) {
      case "grdNumber": return normalize(r.grdNumber)
      case "project": return normalize(r.project)
      case "origin": return normalize(r.origin)
      case "destination": return normalize(r.destination)
      case "direction": {
        const map: Record<Direction, string> = {
          "to-client": "para cliente",
          "from-client": "de cliente",
          "to-supplier": "para fornecedor",
          "from-supplier": "de fornecedor",
        }
        return `${normalize(r.direction)} ${map[r.direction]}`
      }
      case "documentsCount": return normalize(r.documentsCount)
      case "date": return normalize(r.date)
      case "status": return normalize(r.status)
    }
  }

  const filteredByTab = useMemo(() => {
    if (tab === "all") return grds
    return grds.filter(g => g.direction === tab)
  }, [grds, tab])

  const visibleRows = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return filteredByTab
    const fields = selectedFields.length ? selectedFields : ALL_FIELDS
    return filteredByTab.filter(row => fields.some(f => fieldValue(row, f).includes(query)))
  }, [filteredByTab, q, selectedFields])

  const toggleField = (key: FilterKey, checked: boolean) => {
    setSelectedFields(prev => {
      if (checked) {
        if (prev.includes(key)) return prev
        return [...prev, key]
      }
      return prev.filter(k => k !== key)
    })
  }
  const clearAll = () => setSelectedFields([])
  const selectAll = () => setSelectedFields(ALL_FIELDS)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header sem os botões; usa o vidro */}
      <header className="glass-nav">
        <div className="mx-auto max-w-screen-2xl h-14 px-4 md:px-6 flex items-center justify-between">
          <MainNav currentPath="/grds" />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader
            title="Guias de Remessa de Documentação"
            description="Gerencie todas as GRDs e protocolos de tramitação"
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full">
              {/* Campo de busca */}
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar GRDs..."
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

              {/* Filtros: múltipla seleção, mantém aberto ao clicar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <FilterIcon className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {FILTER_OPTIONS.map(opt => (
                    <DropdownMenuCheckboxItem
                      key={opt.key}
                      checked={selectedFields.includes(opt.key)}
                      onSelect={(e) => e.preventDefault()}           // não fechar ao marcar
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

              <Button variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Relatório
              </Button>
            </div>
          </PageHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="to-client">Para Cliente</TabsTrigger>
              <TabsTrigger value="from-client">De Cliente</TabsTrigger>
              <TabsTrigger value="to-supplier">Para Fornecedor</TabsTrigger>
              <TabsTrigger value="from-supplier">De Fornecedor</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Todas as GRDs</CardTitle>
                  <CardDescription>Listagem completa de todas as guias de remessa geradas</CardDescription>
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
                        <TableHead>Documentos</TableHead>
                        <TableHead>Data</TableHead>
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
                                grd.direction === "to-client" && "border-blue-500 text-blue-500",
                                grd.direction === "from-client" && "border-green-500 text-green-500",
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
                          <TableCell>{grd.documentsCount}</TableCell>
                          <TableCell>{grd.date}</TableCell>
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
                                  <Link to={`/documents/routing/${grd.id}/grd`} className="flex w-full">
                                    Visualizar GRD
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link to="#" className="flex w-full">
                                    Exportar PDF
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link to="#" className="flex w-full">
                                    Imprimir
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link to={`/requests/${grd.id}`} className="flex w-full">
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
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                            Nenhuma GRD encontrada.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* As outras tabs reciclam o mesmo state de busca/filtros via `tab` */}
            <TabsContent value="to-client" />
            <TabsContent value="from-client" />
            <TabsContent value="to-supplier" />
            <TabsContent value="from-supplier" />
          </Tabs>
        </div>
      </main>
    </div>
  )
}
