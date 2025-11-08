// src/pages/resources/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import {
  Filter as FilterIcon,
  Search,
  MoreHorizontal,
  Plus,
  User2,
  Building2,
  Phone,
  Mail,
  FolderKanban,
  FileText,
  GitPullRequest,
  X,
} from "lucide-react";

import { apiGet } from "@/services/api";

/** ==== Tipos ==== */
type OrgType = "client" | "supplier" | "internal";

type Resource = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone?: string | null;
  orgType: OrgType;
  orgName?: string | null;
  projects?: Array<{ id: number; name: string }>;
  requests?: Array<{ id: number; number: string }>;
  documents?: Array<{ id: number; code: string; status?: string }>;
  status?: "Ativo" | "Inativo";
  tags?: string[];
};

/** ==== Utilidades ==== */
const FILTER_OPTIONS = [
  { key: "name", label: "Nome" },
  { key: "role", label: "Papel" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "org", label: "Parceria" },
  { key: "projects", label: "Projetos" },
  { key: "requests", label: "Solicitações" },
  { key: "documents", label: "Documentos" },
  { key: "status", label: "Status" },
  { key: "tags", label: "Tags" },
] as const;
type FilterKey = (typeof FILTER_OPTIONS)[number]["key"];

function norm(s: string | null | undefined) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function statusVariant(s?: Resource["status"]) {
  const v = (s || "").toLowerCase();
  return v === "ativo" ? "default" : "secondary";
}

// mapeia o DTO do backend => Resource da UI
function mapResourceFromApi(raw: any): Resource {
  const typeStr = String(raw.partnershipType ?? "").toUpperCase();
  const orgType: OrgType =
    typeStr === "SUPPLIER"
      ? "supplier"
      : typeStr === "INTERNAL"
      ? "internal"
      : "client";

  const statusStr = String(raw.status ?? "").toUpperCase();
  const status: "Ativo" | "Inativo" | undefined =
    statusStr === "ATIVO" ? "Ativo" : statusStr === "INATIVO" ? "Inativo" : undefined;

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    role: String(raw.role ?? ""),
    email: String(raw.email ?? ""),
    phone: raw.phone ?? null,
    orgType,
    orgName: raw.partnershipName ?? null,
    status,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    // por enquanto sem vínculos reais
    projects: [],
    requests: [],
    documents: [],
  };
}

export default function ResourcesPage() {
  const navigate = useNavigate();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const ALL_FIELDS = FILTER_OPTIONS.map((o) => o.key) as FilterKey[];
  const [selectedFields, setSelectedFields] = useState<FilterKey[]>(ALL_FIELDS);

  // carrega do backend
  useEffect(() => {
    let aborted = false;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await apiGet<any[]>("/api/v1/resources");
        const arr = Array.isArray(data) ? data : [];

        const mapped = arr.map(mapResourceFromApi);
        if (!aborted) {
          setResources(mapped);
        }
      } catch (e) {
        console.error("Falha ao carregar recursos:", e);
        if (!aborted) {
          setLoadError("Não foi possível carregar os recursos.");
          setResources([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  const fieldValue = (r: Resource, key: FilterKey): string => {
    switch (key) {
      case "name":
        return norm(r.name);
      case "role":
        return norm(r.role);
      case "email":
        return norm(r.email);
      case "phone":
        return norm(r.phone);
      case "org": {
        const t =
          r.orgType === "client"
            ? "cliente"
            : r.orgType === "supplier"
            ? "fornecedor"
            : "interno";
        return [t, r.orgName].map(norm).join(" ");
      }
      case "projects":
        return norm(r.projects?.map((p) => p.name).join(" ") || "");
      case "requests":
        return norm(r.requests?.map((rq) => rq.number).join(" ") || "");
      case "documents":
        return norm(r.documents?.map((d) => d.code).join(" ") || "");
      case "status":
        return norm(r.status);
      case "tags":
        return norm(r.tags?.join(" ") || "");
    }
  };

  const rows = useMemo(() => {
    const query = norm(q);
    const source = resources;
    if (!query) return source;
    const fields = selectedFields.length ? selectedFields : ALL_FIELDS;
    return source.filter((r) => fields.some((f) => fieldValue(r, f).includes(query)));
  }, [q, selectedFields, resources]);

  const toggleField = (key: FilterKey, checked: boolean) => {
    setSelectedFields((prev) =>
      checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)
    );
  };
  const clearAll = () => setSelectedFields([]);
  const selectAll = () => setSelectedFields(ALL_FIELDS);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader
            title="Recursos"
            description="Cadastre e gerencie usuários/contatos do ecossistema (clientes, fornecedores, internos)"
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full">
              {/* Busca */}
              <div className="relative w-full sm:w-[320px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar recursos..."
                  className="pl-8 pr-8"
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
                  <Button variant="outline">
                    <FilterIcon className="mr-2 h-4 w-4" /> Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
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
                  <div className="px-2 py-1.5 flex items-center justify-between">
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

              {/* Novo recurso */}
              <Button onClick={() => navigate("/resources/new")} aria-label="Criar novo recurso">
                <Plus className="mr-2 h-4 w-4" /> Novo Recurso
              </Button>
            </div>
          </PageHeader>

          {loading && (
            <p className="text-sm text-muted-foreground mb-2">Carregando recursos...</p>
          )}
          {loadError && (
            <p className="text-sm text-red-500 mb-2">{loadError}</p>
          )}

          <ResourceTable rows={rows} />
        </div>
      </main>
    </div>
  );
}

/** ==== Tabela compacta ==== */
function ResourceTable({ rows }: { rows: Resource[] }) {
  const labelByOrg: Record<OrgType, string> = {
    client: "Cliente",
    supplier: "Fornecedor",
    internal: "Interno",
  };

  return (
    <Card className="neon-border">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">Lista de Recursos</CardTitle>
        <CardDescription className="text-sm">
          Contatos/usuários relacionados a clientes, fornecedores, projetos, solicitações e documentos
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Recurso</TableHead>
              <TableHead className="w-[140px]">Papel</TableHead>
              <TableHead className="w-[220px]">Contato</TableHead>
              <TableHead className="w-[200px]">Parceria</TableHead>
              <TableHead className="w-[90px]">Proj.</TableHead>
              <TableHead className="hidden lg:table-cell w-[90px]">Solic.</TableHead>
              <TableHead className="hidden lg:table-cell w-[90px]">Docs</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
              <TableHead className="text-right w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className="align-top">
                <TableCell className="leading-tight font-medium">
                  <div className="flex items-start gap-2">
                    <User2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {r.tags?.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="truncate">{r.role}</TableCell>

                <TableCell className="leading-tight">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{r.email}</span>
                  </div>
                  {r.phone && (
                    <div className="flex items-center gap-2 min-w-0 mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs truncate">{r.phone}</span>
                    </div>
                  )}
                </TableCell>

                <TableCell className="leading-tight">
                  <div className="flex items-start gap-2 min-w-0">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="truncate">{r.orgName ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {labelByOrg[r.orgType]}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <span>{r.projects?.length ?? 0}</span>
                  </div>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    <span>{r.requests?.length ?? 0}</span>
                  </div>
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{r.documents?.length ?? 0}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={statusVariant(r.status) as any} className="px-2 py-0 h-6">
                    {r.status ?? "—"}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/resources/${r.id}`}>Ver detalhes</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/resources/${r.id}/edit`}>Editar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/projects?resource=${r.id}`}>Ver projetos</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/requests?resource=${r.id}`}>Ver solicitações</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/documents?resource=${r.id}`}>Ver documentos</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  Nenhum recurso encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
