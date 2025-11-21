// src/pages/clients/[id]/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit3, Mail, Phone, User2 } from "lucide-react";
import { apiGet } from "@/services/api";

type ClientDetailDTO = {
  id: number;
  name: string;
  status?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  projectsCount?: number | null;
};

type ClientProject = {
  id: number;
  code?: string | null;
  name: string;
  status?: string | null;
  startDate?: string | null;
  plannedEndDate?: string | null;
};

function statusPill(s?: string | null) {
  const label = (s || "ATIVO").toUpperCase();
  const isActive = label === "ATIVO";
  return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Ativo" : label}</Badge>;
}

/** Tenta interpretar várias formas de data (ISO, yyyy-mm-dd, dd/mm/yyyy, timestamp). */
function parseAnyDate(v?: any): Date | null {
  if (!v && v !== 0) return null;
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function toDateLabel(v?: any) {
  const d = parseAnyDate(v);
  return d ? d.toLocaleDateString() : "—";
}

/** Normaliza as possíveis chaves que podem vir do backend. */
function normalizeProject(p: any): ClientProject {
  const status =
    p?.status ??
    p?.statusInicial ??
    p?.projectStatus ??
    p?.situacao ??
    p?.state ??
    null;

  const start =
    p?.startDate ??
    p?.dataInicio ??
    p?.inicio ??
    p?.start_at ??
    p?.start_date ??
    null;

  const planned =
    p?.plannedEndDate ??
    p?.endDate ??
    p?.dataPrevistaConclusao ??
    p?.dataFim ??
    p?.expectedEndDate ??
    p?.planned_end_date ??
    null;

  return {
    id: p?.id,
    code: p?.code ?? p?.codigo ?? null,
    name: p?.name ?? p?.titulo ?? p?.title ?? "(sem nome)",
    status,
    startDate: start,
    plannedEndDate: planned,
  };
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<ClientDetailDTO | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Carrega cliente
  useEffect(() => {
    if (!id) return;
    let cancel = false;

    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const cli = await apiGet<ClientDetailDTO>(`/clients/${id}`);
        if (!cancel) setClient(cli);
      } catch (e: any) {
        if (!cancel) setErrorMsg(e?.message || "Não foi possível carregar o cliente.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => { cancel = true; };
  }, [id]);

  // Carrega projetos do cliente e faz fallback para /projects/:id/detail se necessário
  useEffect(() => {
    if (!id) return;
    let cancel = false;

    async function fetchProjectsForClient(clientId: string) {
      // tenta vários endpoints de listagem
      const candidates = [
        `/clients/${clientId}/projects`,
        `/projects?clientId=${clientId}`,
        `/projects/search?clientId=${clientId}`,
        `/projects/by-client/${clientId}`,
      ];

      let baseList: any[] | null = null;
      for (const url of candidates) {
        try {
          const data: any = await apiGet<any>(url);
          const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : null;
          if (list) { baseList = list; break; }
        } catch { /* tenta próximo */ }
      }

      if (!baseList) {
        if (!cancel) setProjects([]);
        return;
      }

      // normaliza
      let mapped = baseList.map(normalizeProject);

      // identifica quem precisa de enrich (faltando status, inicio ou previsão)
      const needEnrich = mapped.filter(p => !p.status || !p.startDate || !p.plannedEndDate);

      if (needEnrich.length > 0) {
        // busca detalhes apenas dos necessários
        const details = await Promise.all(
          needEnrich.map(async (p) => {
            try {
              const d = await apiGet<any>(`/projects/${p.id}/detail`);
              return { id: p.id, detail: d };
            } catch {
              return { id: p.id, detail: null };
            }
          })
        );

        // aplica detalhes
        const detailMap = new Map<number, any>();
        details.forEach(({ id, detail }) => { if (detail) detailMap.set(id, detail); });

        mapped = mapped.map((p) => {
          const d = detailMap.get(p.id);
          if (!d) return p;
          const enriched = normalizeProject({ ...p, ...d });
          // preserva code/name originais se vierem melhor da lista
          return {
            ...enriched,
            code: p.code ?? enriched.code,
            name: p.name ?? enriched.name,
          };
        });
      }

      if (!cancel) setProjects(mapped);
    }

    fetchProjectsForClient(id);
    return () => { cancel = true; };
  }, [id]);

  const projCountShown = useMemo(
    () => (typeof client?.projectsCount === "number" ? client!.projectsCount! : projects.length),
    [client, projects.length]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader
            title={client?.name ?? "Cliente"}
            description="Cliente"
          >
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (history.length > 1) navigate(-1);
                  else navigate("/clients");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {client?.id && (
                <Link to={`/clients/${client.id}/edit`}>
                  <Button variant="secondary">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              )}
            </div>
          </PageHeader>

          {/* Informações do cliente */}
          <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>Dados cadastrais e de contato</CardDescription>
            </CardHeader>
            <CardContent>
              {errorMsg && <div className="text-sm text-red-500 mb-4">{errorMsg}</div>}

              <div className="flex items-center gap-3 mb-4">
                {statusPill(client?.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    Contato
                  </div>
                  <div className="font-medium">{client?.contactName || "—"}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </div>
                  <div className="font-medium">{client?.contactEmail || "—"}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </div>
                  <div className="font-medium">{client?.contactPhone || "—"}</div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Projetos vinculados:</span>
                <span className="font-semibold text-foreground">{projCountShown}</span>
              </div>
            </CardContent>
          </Card>

          {/* Projetos do cliente */}
          <Card className="neon-border mt-6 border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Projetos</CardTitle>
              <CardDescription>Projetos associados a este cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}

              {!loading && projects.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Nenhum projeto encontrado para este cliente.
                </div>
              )}

              {!loading && projects.length > 0 && (
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {p.code ? `${p.code} — ` : ""}{p.name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                          <span>Status: {p.status || "—"}</span>
                          <span>Início: {toDateLabel(p.startDate)}</span>
                          <span>Previsão: {toDateLabel(p.plannedEndDate)}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Link to={`/projects/${p.id}`}>
                          <Button variant="outline" size="sm">Ver detalhes</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
