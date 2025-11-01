// src/pages/projects/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderKanban, MoreHorizontal, Plus, Search, Users, Edit } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import AppHeader from "@/components/AppHeader";

import { apiGet } from "@/services/api";

type ProjectListItem = {
  id: number;
  nome: string;
  cliente: string | null;
  documentos: number;
  status: string | null;
  ultimaAtualizacao: string | null; // ISO
};

type PageResp<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index
  size: number;
};

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const now = new Date();
  const dt = new Date(iso);
  const diffMs = dt.getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  const week = Math.round(day / 7);
  const month = Math.round(day / 30);
  const year = Math.round(day / 365);

  if (Math.abs(sec) < 60) return rtf.format(sec, "second");
  if (Math.abs(min) < 60) return rtf.format(min, "minute");
  if (Math.abs(hr) < 24) return rtf.format(hr, "hour");
  if (Math.abs(day) < 7) return rtf.format(day, "day");
  if (Math.abs(week) < 5) return rtf.format(week, "week");
  if (Math.abs(month) < 12) return rtf.format(month, "month");
  return rtf.format(year, "year");
}

/** normaliza string para busca: lower + remove acentos + trim */
function norm(s: string | null | undefined) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [data, setData] = useState<PageResp<ProjectListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // busca local
  const [q, setQ] = useState<string>("");

  // paginação (carregamos mais itens para a busca local ficar boa)
  const [page] = useState<number>(0);
  const [size] = useState<number>(100);
  const [status] = useState<string>(""); // reservado p/ futuro filtro de backend

  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      setErrMsg(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("size", String(size));
        if (status) params.set("status", status);

        // IMPORTANTE: passar só o path para o wrapper (ele resolve a base)
        const json = await apiGet<PageResp<ProjectListItem>>(
          `/projects/table?${params.toString()}`
        );

        if (!abort) setData(json);
      } catch (e: any) {
        const msg = String(e?.message || "Erro desconhecido");
        // se for 401/403, o wrapper já redirecionou
        if (!abort && !msg.toLowerCase().includes("não autorizado")) setErrMsg(msg);
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [page, size, status]);

  const projects = useMemo(() => data?.content ?? [], [data]);

  /** lista filtrada em tempo real (nome/cliente/status/id) */
  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return projects;
    return projects.filter((p) => {
      const nNome = norm(p.nome);
      const nCliente = norm(p.cliente);
      const nStatus = norm(p.status);
      const nId = String(p.id);
      return (
        nNome.includes(nq) ||
        nCliente.includes(nq) ||
        nStatus.includes(nq) ||
        nId.includes(nq)
      );
    });
  }, [projects, q]);

  // ao mudar o filtro, readequar seleção
  useEffect(() => {
    setSelectedProjects((prev) => prev.filter((id) => filtered.some((p) => p.id === id)));
  }, [filtered]);

  const handleSelectProject = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    );
  };

  const handleSelectAll = () => {
    setSelectedProjects((prev) => (prev.length === filtered.length ? [] : filtered.map((p) => p.id)));
  };

  const handleEditSelected = () => {
    if (selectedProjects.length === 0) return;
    navigate(`/projects/edit?ids=${selectedProjects.join(",")}`);
  };

  const statusVariant = (s: string | null) => {
    const v = (s || "").toLowerCase();
    if (["em andamento", "active", "aberto", "open"].includes(v)) return "default" as const;
    if (["em revisão", "review", "pendente", "pending"].includes(v)) return "secondary" as const;
    if (["concluído", "concluido", "finalizado", "closed", "done"].includes(v)) return "outline" as const;
    return "outline" as const;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader title="Projetos" description="Gerencie todos os projetos e suas documentações">
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar projetos..."
                  className="w-full md:w-[250px] pl-8"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              {selectedProjects.length > 0 && (
                <Button onClick={handleEditSelected} variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar {selectedProjects.length} Projeto{selectedProjects.length === 1 ? "" : "s"}
                </Button>
              )}

              <Link to="/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Projeto
                </Button>
              </Link>
            </div>
          </PageHeader>

          <Card className="neon-border">
            <CardHeader>
              <CardTitle>Lista de Projetos</CardTitle>
              <CardDescription>Todos os projetos cadastrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && <div className="py-8 text-sm text-muted-foreground">Carregando…</div>}
              {errMsg && !loading && (
                <div className="py-4 text-sm text-red-600">Erro ao carregar projetos: {errMsg}</div>
              )}

              {!loading && !errMsg && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={filtered.length > 0 && selectedProjects.length === filtered.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Documentos</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Última Atualização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={() => handleSelectProject(project.id)}
                            aria-label={`Selecionar ${project.nome}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            {project.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {project.cliente ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell>{project.documentos}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(project.status)}>
                            {project.status ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatRelative(project.ultimaAtualizacao)}</TableCell>
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
                                <Link to={`/projects/${project.id}`} className="flex w-full">
                                  Ver detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`/projects/${project.id}/documents`} className="flex w-full">
                                  Lista de documentos
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`/projects/${project.id}/planning`} className="flex w-full">
                                  Planejamento
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`/projects/${project.id}/routing`} className="flex w-full">
                                  Tramitações
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link to={`/projects/${project.id}/edit`} className="flex w-full">
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-sm text-muted-foreground">
                          Nenhum projeto encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
