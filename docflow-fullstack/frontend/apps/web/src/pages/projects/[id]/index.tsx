// src/pages/projects/[id]/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, FileText, Calendar, Building, Clock, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { apiGet } from "@/services/api";

/* ----------------------------- Tipos do DTO ----------------------------- */
type MilestoneDTO = {
  id: number | string;
  name?: string;
  description?: string;
  dueDate?: string | null;
  projectId?: number;
};

type DocumentDTO = {
  id: number | string;
  code?: string;
  title?: string;
  revision?: string | number;
  projectId?: number;
  type?: string | null;
  status?: string | null;
  milestoneName?: string | null;
};

/** 🔥 NOVO: tipos de documentos previstos (plannedDocTypes do backend) */
type PlannedDocTypeDTO = {
  id: number;
  projectDisciplineId: number;
  disciplineName: string;
  docType: string;
  quantity: number;
};

type ProjectDetailDTO = {
  id: number;
  code?: string;
  name?: string;
  status?: string | null;
  startDate?: string | null;
  plannedEndDate?: string | null;
  description?: string | null;
  clientId?: number | null;
  clientName?: string | null;
  milestones?: MilestoneDTO[];
  documents?: DocumentDTO[];
  /** 🔥 NOVO: campo que vem do ProjectDetailDTO do backend */
  plannedDocTypes?: PlannedDocTypeDTO[];
};

/* -------------------------------- Helpers ------------------------------- */
function toDDMMYYYY(raw?: string | null) {
  if (!raw) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return raw;
}

function statusVariant(status?: string | null) {
  const s = (status || "").toLowerCase();
  if (["concluído", "concluido", "aprovado", "approved", "done"].includes(s)) return "default" as const;
  if (["em andamento", "em revisão", "review", "in progress", "andamento"].includes(s)) return "secondary" as const;
  if (["pendente", "aguardando aprovação", "pending"].includes(s)) return "outline" as const;
  return "outline" as const;
}

/* --------------------------------- Página -------------------------------- */
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDetailDTO | null>(null);

  useEffect(() => {
    let abort = false;

    const tryGet = async <T,>(url: string): Promise<T | null> => {
      try {
        return await apiGet<T>(url);
      } catch {
        return null;
      }
    };

    (async () => {
      if (!id) {
        setErr("ID do projeto não informado.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setErr(null);

      try {
        // 1) Tenta o DTO agregador com /detail (que já inclui plannedDocTypes)
        let dto =
          (await tryGet<ProjectDetailDTO>(`/api/v1/projects/${id}/detail`)) ??
          (await tryGet<ProjectDetailDTO>(`/projects/${id}/detail`));

        // 2) Fallback se não houver /detail
        if (!dto) {
          const base =
            (await tryGet<any>(`/api/v1/projects/${id}`)) ??
            (await tryGet<any>(`/projects/${id}`));

          if (base) {
            const documents =
              (await tryGet<DocumentDTO[]>(`/api/v1/projects/${id}/documents`)) ??
              (await tryGet<DocumentDTO[]>(`/projects/${id}/documents`)) ??
              (await tryGet<DocumentDTO[]>(`/documents?projectId=${id}`)) ??
              [];

            const milestones =
              (await tryGet<MilestoneDTO[]>(`/api/v1/projects/${id}/milestones`)) ??
              (await tryGet<MilestoneDTO[]>(`/projects/${id}/milestones`)) ??
              [];

            dto = {
              id: Number(base.id),
              code: base.code,
              name: base.name,
              status: base.status ?? null,
              startDate: base.startDate ?? null,
              plannedEndDate: base.plannedEndDate ?? null,
              description: base.description ?? null,
              clientId: base.clientId ?? base.client?.id ?? null,
              clientName: base.clientName ?? base.client?.name ?? null,
              documents,
              milestones,
              // sem plannedDocTypes no fallback (não tem endpoint aqui)
            };
          }
        }

        if (!abort) {
          if (!dto) {
            setErr("Projeto não encontrado.");
          } else {
            setProject(dto);
          }
        }
      } catch (e: any) {
        if (!abort) setErr(e?.message ?? "Falha ao carregar projeto");
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [id]);

  const title = useMemo(() => project?.name || "[Projeto]", [project]);
  const code = useMemo(() => project?.code, [project]);
  const status = useMemo(() => project?.status || "—", [project]);
  const startDate = useMemo(() => toDDMMYYYY(project?.startDate), [project]);
  const plannedEndDate = useMemo(() => toDDMMYYYY(project?.plannedEndDate), [project]);
  const description = useMemo(() => project?.description || "", [project]);
  const clientName = useMemo(() => project?.clientName || "—", [project]);

  const milestones = project?.milestones ?? [];
  const documents = project?.documents ?? [];
  const plannedDocTypes = project?.plannedDocTypes ?? []; // 🔥 NOVO

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader title={title} description={code ? `Código: ${code}` : undefined}>
            <div className="w-full sm:w-auto flex sm:justify-end gap-2">
              <Link to="/projects">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              {id && (
                <Link to={`/projects/${id}/edit`}>
                  <Button variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              )}
            </div>
          </PageHeader>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando dados do projeto…
            </div>
          )}

          {err && !loading && (
            <div className="text-sm text-red-600 py-4">Erro ao carregar: {err}</div>
          )}

          {!loading && !err && project && (
            <div className="space-y-6">
              {/* ⭐ INFORMACOES GERAIS - MODO CLARO AJUSTADO */}
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">{clientName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(status)}>{status}</Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Início</p>
                        <p className="font-medium">{startDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Previsão</p>
                        <p className="font-medium">{plannedEndDate}</p>
                      </div>
                    </div>
                  </div>

                  {description && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-muted-foreground">{description}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* ⭐ TABS AJUSTADOS + ABA DE PLANEJAMENTO */}
              <Tabs defaultValue="milestones" className="space-y-4">
                <TabsList className="backdrop-blur-md bg-background/70 dark:bg-card/70">
                  <TabsTrigger value="milestones">Marcos Contratuais</TabsTrigger>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="planning">Planejamento</TabsTrigger> {/* 🔥 NOVO */}
                  <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
                </TabsList>

                {/* Marcos */}
                <TabsContent value="milestones">
                  <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Marcos Contratuais</CardTitle>
                      <CardDescription>Cronograma de entregas e marcos do projeto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {milestones.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhum marco cadastrado.</div>
                      ) : (
                        <div className="space-y-4">
                          {milestones.map((m, i) => {
                            const nm = m.name || `Marco ${i + 1}`;
                            const desc = m.description || "";
                            const due = toDDMMYYYY(m.dueDate);
                            return (
                              <div key={String(m.id)} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-medium">{nm}</h3>
                                  <span className="text-sm text-muted-foreground">{due}</span>
                                </div>
                                {desc && <p className="text-sm text-muted-foreground mb-2">{desc}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Documentos reais */}
                <TabsContent value="documents">
                  <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Documentos do Projeto</CardTitle>
                      <CardDescription>Lista de todos os documentos relacionados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {documents.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhum documento encontrado.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Título</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Revisão</TableHead>
                              <TableHead>Marco</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documents.map((doc) => (
                              <TableRow key={String(doc.id)}>
                                <TableCell className="font-medium">{doc.code ?? String(doc.id)}</TableCell>
                                <TableCell>{doc.title ?? "—"}</TableCell>
                                <TableCell>{doc.type ?? "—"}</TableCell>
                                <TableCell>{String(doc.revision ?? "—")}</TableCell>
                                <TableCell>{doc.milestoneName ?? "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(doc.status)}>{doc.status ?? "—"}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 🔥 NOVO: Planejamento (tipos de documentos previstos) */}
                <TabsContent value="planning">
                  <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Planejamento de Documentos</CardTitle>
                      <CardDescription>
                        Tipos de documentos previstos por disciplina para este projeto.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {plannedDocTypes.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Nenhum tipo de documento previsto para este projeto.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Disciplina</TableHead>
                              <TableHead>Tipo de documento</TableHead>
                              <TableHead className="text-right">Quantidade</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {plannedDocTypes.map((pd) => (
                              <TableRow key={pd.id}>
                                <TableCell className="font-medium">
                                  {pd.disciplineName}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{pd.docType}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {pd.quantity}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Fornecedores */}
                <TabsContent value="suppliers">
                  <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Fornecedores</CardTitle>
                      <CardDescription>Fornecedores envolvidos no projeto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        (Sem fornecedores vinculados nesta versão.)
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
