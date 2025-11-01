// frontend/apps/web/src/pages/projects/edit/index.tsx
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import AppHeader from "@/components/AppHeader";

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:8080";

type ProjectMinimal = {
  id: number;
  name: string;
  client?: string | null;
  status?: string | null;
  priority?: string | null;
  description?: string | null;
};

export default function EditMultipleProjectsPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ids = useMemo(
    () =>
      (searchParams.get("ids") || "")
        .split(",")
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0),
    [searchParams]
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProjects, setSelectedProjects] = useState<ProjectMinimal[]>([]);
  const [patchStatus, setPatchStatus] = useState<string | undefined>(undefined);
  const [patchPriority, setPatchPriority] = useState<string | undefined>(undefined);
  const [patchNotes, setPatchNotes] = useState<string>("");

  // Busca projetos selecionados
  useEffect(() => {
    let ignore = false;

    async function fetchProjects() {
      if (ids.length === 0) return;
      setIsLoading(true);
      try {
        // 1) Tenta endpoint batch: GET /projects?ids=1,2,3
        const qs = encodeURIComponent(ids.join(","));
        const tryBatch = await fetch(`${API_BASE}/projects?ids=${qs}`);
        if (tryBatch.ok) {
          const data = await tryBatch.json();
          if (!ignore) {
            setSelectedProjects(
              (Array.isArray(data) ? data : []).map((p) => ({
                id: p.id,
                name: p.name,
                client: p.client ?? p.clientName ?? null,
                status: p.status ?? null,
                priority: p.priority ?? null,
                description: p.description ?? "",
              }))
            );
          }
        } else {
          // 2) Fallback: GET /projects/:id em paralelo
          const results = await Promise.all(
            ids.map(async (id) => {
              const r = await fetch(`${API_BASE}/projects/${id}`);
              if (!r.ok) throw new Error(`Falha ao carregar projeto ${id}`);
              return r.json();
            })
          );
          if (!ignore) {
            setSelectedProjects(
              results.map((p) => ({
                id: p.id,
                name: p.name,
                client: p.client ?? p.clientName ?? null,
                status: p.status ?? null,
                priority: p.priority ?? null,
                description: p.description ?? "",
              }))
            );
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    fetchProjects();
    return () => {
      ignore = true;
    };
  }, [ids]);

  // Submeter alterações em lote
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ids.length === 0) {
      navigate("/projects");
      return;
    }

    setIsLoading(true);
    const patch: Record<string, unknown> = {};
    if (patchStatus) patch.status = patchStatus;
    if (patchPriority) patch.priority = patchPriority;
    if (patchNotes && patchNotes.trim()) {
      // convencionado como "appendNotes" (ajuste conforme seu backend)
      patch.appendNotes = patchNotes.trim();
    }

    try {
      // 1) Tenta endpoint batch nativo
      const batchRes = await fetch(`${API_BASE}/projects/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, patch }),
      });

      if (batchRes.ok) {
        navigate("/projects");
        return;
      }

      // 2) Fallback: PUT /projects/:id individual
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`${API_BASE}/projects/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          });
          if (!res.ok) throw new Error(`Falha ao atualizar projeto ${id}`);
        })
      );

      navigate("/projects");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectionCount = selectedProjects.length;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader
            title="Editar Projetos em Lote"
            description={
              ids.length === 0
                ? "Nenhum projeto informado. Selecione projetos na lista e clique em Editar em lote."
                : `Editar ${selectionCount} projeto${selectionCount === 1 ? "" : "s"} selecionado${
                    selectionCount === 1 ? "" : "s"
                  }`
            }
          >
            <Link to="/projects">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          {/* Lista dos projetos selecionados */}
          <Card className="neon-border">
            <CardHeader>
              <CardTitle>Projetos Selecionados</CardTitle>
              <CardDescription>
                {isLoading
                  ? "Carregando projetos…"
                  : selectionCount > 0
                  ? "Estes projetos receberão as alterações abaixo"
                  : "Nenhum projeto carregado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedProjects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.client ?? "—"}</p>
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>{p.status ?? "sem status"}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="hidden md:inline">{p.priority ?? "sem prioridade"}</span>
                    </div>
                  </div>
                ))}
                {!isLoading && selectedProjects.length === 0 && (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Selecione projetos na página <strong>Projetos</strong> e clique em <em>Editar em Lote</em>.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Formulário de alterações em lote */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Alterações em Lote</CardTitle>
                <CardDescription>As alterações abaixo serão aplicadas a todos os projetos selecionados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Alterar Status</Label>
                    <Select
                      value={patchStatus}
                      onValueChange={(v) => setPatchStatus(v)}
                      disabled={isLoading || selectedProjects.length === 0}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione um novo status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="em-andamento">Em Andamento</SelectItem>
                        <SelectItem value="em-revisao">Em Revisão</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Definir Prioridade</Label>
                    <Select
                      value={patchPriority}
                      onValueChange={(v) => setPatchPriority(v)}
                      disabled={isLoading || selectedProjects.length === 0}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (anexadas a cada projeto)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex.: Registrar alinhamento com o cliente, atribuir próxima ação, etc."
                    className="min-h-[100px]"
                    value={patchNotes}
                    onChange={(e) => setPatchNotes(e.target.value)}
                    disabled={isLoading || selectedProjects.length === 0}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link to="/projects">
                <Button variant="outline" type="button" disabled={isLoading}>
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isLoading || selectedProjects.length === 0 || (!patchStatus && !patchPriority && !patchNotes.trim())}
                className="neon-border"
              >
                {isLoading ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações em Lote
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
