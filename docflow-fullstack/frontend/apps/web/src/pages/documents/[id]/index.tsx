// src/pages/documents/[id]/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  PencilLine,
  Clock,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiGet } from "@/services/api";
import { cn } from "@/lib/utils";

type ProjectLite = {
  id: number;
  code?: string | null;
  name?: string | null;
};

type DocumentApi = {
  id: number;
  code: string;
  title?: string | null;
  name?: string | null;
  revision?: string | null;
  format?: string | null;
  currentLocation?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  pages?: number | null;
  performedDate?: string | null;
  dueDate?: string | null;
  technicalResponsible?: string | null;
  project?: ProjectLite | null;
};

export default function PageDocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const docId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<DocumentApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(docId)) {
      setError("ID de documento inválido.");
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGet<DocumentApi>(`/documents/${docId}`);

        if (!alive) return;
        setDoc(data ?? null);
        if (!data) setError("Documento não encontrado.");
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg.includes("404")) {
          setError("Documento não encontrado.");
        } else {
          setError(msg || "Erro ao carregar documento.");
        }
        setDoc(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [docId]);

  const docName = doc?.title || doc?.name || "(sem título)";
  const projectName =
    (doc?.project?.name && doc?.project?.code
      ? `${doc.project.name} — ${doc.project.code}`
      : doc?.project?.name || doc?.project?.code) || "-";

  const revision = doc?.revision || "-";
  const format = doc?.format || "-";
  const status = doc?.status || "-";
  const location = doc?.currentLocation || "-";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader
            title={
              loading
                ? "Carregando..."
                : doc
                ? `Documento ${doc.code}`
                : "Documento não encontrado."
            }
            description={doc ? docName : undefined}
          >
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {doc && (
                <>
                  <Link
                    to={
                      doc.project?.id ? `/projects/${doc.project.id}` : "#"
                    }
                  >
                    <Button variant="outline" disabled={!doc.project?.id}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Ver Projeto
                    </Button>
                  </Link>

                  <Link to={`/documents/${doc.id}/edit`}>
                    <Button className="neon-border">
                      <PencilLine className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </PageHeader>

          {loading && (
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle>Carregando dados…</CardTitle>
                <CardDescription>
                  Buscando informações do documento
                </CardDescription>
              </CardHeader>
              <CardContent>…</CardContent>
            </Card>
          )}

          {!loading && error && (
            <div className="text-center text-muted-foreground mt-12">
              {error}
            </div>
          )}

          {!loading && !error && doc && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Resumo */}
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md shadow-lg lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {docName}
                  </CardTitle>
                  <CardDescription>Código {doc.code}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Info label="Projeto" value={projectName} />
                    <Info label="Revisão" value={revision} />
                    <Info label="Formato" value={format} />
                    <Info label="Localização Atual" value={location} />

                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">
                        Status
                      </span>
                      <Badge className="w-fit">{status}</Badge>
                    </div>

                    <Info label="Páginas" value={doc.pages ?? "-"} />
                    <Info
                      label="Responsável técnico"
                      value={doc.technicalResponsible ?? "-"}
                    />
                    <Info
                      label="Atualizado em"
                      value={
                        doc.updatedAt
                          ? formatWhen(doc.updatedAt)
                          : "-"
                      }
                    />
                    <Info
                      label="Prazo"
                      value={
                        doc.dueDate ? formatWhen(doc.dueDate) : "-"
                      }
                    />
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Descrição
                    </div>
                    <div className="text-sm">
                      {doc.description || "—"}
                    </div>
                  </div>

                  {doc.fileUrl && (
                    <>
                      <Separator />
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                          Arquivo principal
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline"
                        >
                          Abrir arquivo
                        </a>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Metadados */}
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md shadow-lg">
                <CardHeader>
                  <CardTitle>Metadados</CardTitle>
                  <CardDescription>
                    Informações de ciclo e integridade
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Meta
                    icon={<Clock className="h-4 w-4" />}
                    label="Data de execução"
                    value={
                      doc.performedDate
                        ? formatWhen(doc.performedDate)
                        : "-"
                    }
                  />
                  <Meta
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Integridade"
                    value="—"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground mb-1">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-md border p-1">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm">{value}</span>
      </div>
    </div>
  );
}

function formatWhen(isoOrDate: string) {
  try {
    const d = new Date(isoOrDate);
    return d.toLocaleString();
  } catch {
    return isoOrDate;
  }
}
