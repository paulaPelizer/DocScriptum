import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, ArrowRightLeft, Filter as FilterIcon } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { apiGet } from "@/services/api";

/** === Tipos compatíveis com o backend (DocumentListItemDTO) === */
type DocumentListItemDTO = {
  id: number;
  code: string;
  title: string | null;
  revision: string | null;
  format: string | null;
  currentLocation: string | null;
  status: string | null;
  updatedAt: string | null; // ISO string
  projectId: number | null;
  projectName: string | null;
};

/** Tipo que sua tabela já usa */
type UIDocument = {
  id: number;
  code: string;
  name: string;
  project: string;
  revision: string;
  format: string;
  status: string;
  lastLocation: string;
  lastUpdated: string;
};

type PageResp<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function formatTimeAgo(iso?: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "agora";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min atrás`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} h atrás`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} dia${days > 1 ? "s" : ""} atrás`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

/** Opções de filtro (mapeiam para as chaves renderizadas na tabela) */
const FILTER_OPTIONS = [
  { key: "code", label: "Código" },
  { key: "name", label: "Nome" },
  { key: "project", label: "Projeto" },
  { key: "revision", label: "Revisão" },
  { key: "format", label: "Formato" },
  { key: "lastLocation", label: "Localização Atual" },
  { key: "status", label: "Status" },
  { key: "lastUpdated", label: "Atualização" },
] as const;

type FilterKey = typeof FILTER_OPTIONS[number]["key"];

export default function DocumentsPage() {
  const navigate = useNavigate();

  // Dados do backend
  const [docs, setDocs] = useState<UIDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // Busca/filtragem local
  const [q, setQ] = useState("");

  // >>> novo: múltiplos campos selecionados (como em clients)
  const ALL_FIELDS = FILTER_OPTIONS.map((o) => o.key) as FilterKey[];
  const [selectedFields, setSelectedFields] = useState<FilterKey[]>(ALL_FIELDS);

  const routings = [
    {
      id: 1,
      grdNumber: "GRD-ABC-XYZ-2025001",
      project: "Projeto Alpha",
      origin: "Empresa ABC",
      destination: "Construtora XYZ",
      documentsCount: 3,
      date: "10/05/2025",
      status: "Aguardando fornecedor",
    },
    {
      id: 2,
      grdNumber: "GRD-XYZ-ABC-2025001",
      project: "Expansão Sede",
      origin: "Construtora XYZ",
      destination: "Empresa ABC",
      documentsCount: 2,
      date: "08/05/2025",
      status: "Aguardando cliente interno",
    },
    {
      id: 3,
      grdNumber: "GRD-IND-XYZ-2025001",
      project: "Reforma Unidade 3",
      origin: "Indústria 123",
      destination: "Construtora XYZ",
      documentsCount: 5,
      date: "05/05/2025",
      status: "Concluído",
    },
  ];

  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("Aguardando cliente")) return "outline";
    if (status.includes("Em revisão")) return "secondary";
    if (status.includes("Aguardando fornecedor")) return "outline";
    if (status === "Concluído") return "default";
    if (status === "Rejeitado") return "destructive";
    return "outline";
  };

  const getStatusBadgeClass = (status: string) => {
    if (status.includes("Aguardando cliente")) return "border-blue-500 text-blue-500";
    if (status.includes("Aguardando fornecedor")) return "border-purple-500 text-purple-500";
    if (status.includes("Aguardando cliente interno")) return "border-green-500 text-green-500";
    return "";
  };

  async function fetchDocuments() {
    setLoading(true);
    try {
      const pageResp = await apiGet<PageResp<DocumentListItemDTO>>(
        `/api/v1/documents?page=0&size=20&sort=${encodeURIComponent("updatedAt,desc")}`
      );

      const mapped: UIDocument[] = (pageResp?.content || []).map((d) => ({
        id: d.id,
        code: d.code,
        name: d.title ?? "",
        project: d.projectName ?? "",
        revision: d.revision ?? "",
        format: d.format ?? "",
        status: d.status ?? "",
        lastLocation: d.currentLocation ?? "",
        lastUpdated: formatTimeAgo(d.updatedAt),
      }));

      setDocs(mapped);
    } catch (err) {
      console.error("Erro ao carregar documentos:", err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  // === NOVO: handler para redirecionar edição por hash ===
  const handleEdit = async (docId: number) => {
    try {
      const detail: any = await apiGet(`/api/v1/documents/${docId}`);
      const hash =
        detail?.uploadHash ??
        detail?.upload_hash ??
        detail?.hash ??
        detail?.uploadId ??
        null;

      if (hash) {
        navigate(`/documents/new?hash=${encodeURIComponent(String(hash))}`);
      } else {
        navigate(`/documents/new?hash=id-${docId}`);
      }
    } catch (e) {
      console.error("Falha ao obter hash para edição:", e);
      navigate(`/documents/new`);
    }
  };

  // Filtragem local “ao digitar” considerando múltiplos campos
  const filteredDocs = useMemo(() => {
    if (!q.trim()) return docs;

    // se nenhum campo estiver marcado, tratamos como "todos"
    const fields = selectedFields.length ? selectedFields : ALL_FIELDS;

    const query = q.toLowerCase();
    const match = (value?: string) => (value ?? "").toLowerCase().includes(query);

    return docs.filter((d) =>
      fields.some((key) => {
        const val = String((d as any)[key] ?? "");
        return match(val);
      })
    );
  }, [docs, q, selectedFields]);

  // helpers filtro
  const toggleField = (key: FilterKey, checked: boolean) => {
    setSelectedFields((prev) => {
      if (checked) {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      }
      return prev.filter((k) => k !== key);
    });
  };
  const clearAll = () => setSelectedFields([]);
  const selectAll = () => setSelectedFields(ALL_FIELDS);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader title="Documentos" description="Gerencie documentos e tramitações">
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar documentos..."
                  className="pl-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              {/* Filtros: múltipla seleção, não fechar ao marcar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <FilterIcon className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px]">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {FILTER_OPTIONS.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.key}
                      checked={selectedFields.includes(opt.key)}
                      // impede o fechamento do menu ao clicar
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

              <Link to="/documents/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Documento
                </Button>
              </Link>
              <Link to="/documents/routing/new">
                <Button className="neon-border">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Nova Tramitação
                </Button>
              </Link>
            </div>
          </PageHeader>

          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="routings">Tramitações</TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Lista de Documentos</CardTitle>
                  <CardDescription>Todos os documentos cadastrados no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Revisão</TableHead>
                        <TableHead>Formato</TableHead>
                        <TableHead>Localização Atual</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Atualização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : filteredDocs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">
                            Nenhum documento encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDocs.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.code}</TableCell>
                            <TableCell>{doc.name}</TableCell>
                            <TableCell>{doc.project}</TableCell>
                            <TableCell>{doc.revision}</TableCell>
                            <TableCell>{doc.format}</TableCell>
                            <TableCell>{doc.lastLocation}</TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusBadgeVariant(doc.status)}
                                className={cn(getStatusBadgeClass(doc.status))}
                              >
                                {doc.status || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>{doc.lastUpdated}</TableCell>
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
                                    <Link to={`/documents/${doc.id}`} className="flex w-full">
                                      Ver detalhes
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/documents/${doc.id}/history`} className="flex w-full">
                                      Histórico de revisões
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleEdit(doc.id)}>
                                    <Link to={`/documents/${doc.id}/edit`} className="flex w-full">
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="routings">
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Tramitações</CardTitle>
                  <CardDescription>Histórico de tramitações de documentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GRD</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Documentos</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routings.map((routing) => (
                        <TableRow key={routing.id}>
                          <TableCell className="font-medium">{routing.grdNumber}</TableCell>
                          <TableCell>{routing.project}</TableCell>
                          <TableCell>{routing.origin}</TableCell>
                          <TableCell>{routing.destination}</TableCell>
                          <TableCell>{routing.documentsCount}</TableCell>
                          <TableCell>{routing.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(routing.status)}
                              className={cn(getStatusBadgeClass(routing.status))}
                            >
                              {routing.status}
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
                                  <Link to={`/documents/routing/${routing.id}`} className="flex w-full">
                                    Ver detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/documents/routing/${routing.id}/grd`} className="flex w-full">
                                    Visualizar GRD
                                  </Link>
                                </DropdownMenuItem>
                                {routing.status !== "Concluído" && (
                                  <DropdownMenuItem asChild>
                                    <Link to={`/documents/routing/${routing.id}/validate`} className="flex w-full">
                                      Validar
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
