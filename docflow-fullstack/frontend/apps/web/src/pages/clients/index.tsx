// src/pages/clients/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreHorizontal,
  Plus,
  Search,
  Users,
  Building,
  Phone,
  Mail,
  Filter,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
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

import { listClients, statusLabel, type ClientDTO, type PageResp } from "@/services/clients";

type FieldKey = "name" | "contact" | "email" | "phone" | "projects" | "status";

const FIELD_LABEL: Record<FieldKey, string> = {
  name: "Nome",
  contact: "Contato",
  email: "Email",
  phone: "Telefone",
  projects: "Projetos",
  status: "Status",
};

export default function ClientsPage() {
  const [data, setData] = useState<PageResp<ClientDTO> | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  // busca com debounce
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState("");

  // filtros: em quais campos a busca incide
  const allFields: FieldKey[] = ["name", "contact", "email", "phone", "projects", "status"];
  const [selectedFields, setSelectedFields] = useState<FieldKey[]>(allFields); // padrão: todos

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setQ(typing), 400);
    return () => clearTimeout(t);
  }, [typing]);

  // resetar página quando filtros/busca mudarem
  useEffect(() => {
    setPage(0);
  }, [q, selectedFields]);

  // carregar dados
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const params: any = {
          page,
          size,
          q,
          fields: selectedFields.join(","), // ex.: "name,contact,email"
        };
        const res = await listClients(params);
        setData(res);
      } catch (e: any) {
        setErrorMsg(e?.message || "Erro ao carregar clientes.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, size, q, selectedFields]);

  const rows = useMemo(() => data?.content ?? [], [data]);
  const totalPages = data?.totalPages ?? 0;

  const suppliers = [
    {
      id: 1,
      name: "Fornecedor Exemplo",
      contact: "Fulano",
      email: "fulano@sup.com",
      phone: "(11) 99999-9999",
      projectsCount: 0,
      status: "Ativo",
    },
  ];

  const toggleField = (key: FieldKey, checked: boolean) => {
    setSelectedFields((prev) => {
      if (checked) {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      }
      return prev.filter((k) => k !== key);
    });
  };

  const clearAll = () => setSelectedFields([]);
  const selectAll = () => setSelectedFields(allFields);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader
            title="Clientes e Fornecedores"
            description="Gerencie todos os clientes e fornecedores"
          >
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="w-full md:w-[260px] pl-8"
                  value={typing}
                  onChange={(e) => {
                    setTyping(e.target.value);
                    setPage(0);
                  }}
                />
              </div>

              {/* Filtros (lista + ações Limpar/Selecionar tudo) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filtros</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={selectedFields.includes("name")}
                    onCheckedChange={(c) => toggleField("name", Boolean(c))}
                  >
                    {FIELD_LABEL.name}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedFields.includes("contact")}
                    onCheckedChange={(c) => toggleField("contact", Boolean(c))}
                  >
                    {FIELD_LABEL.contact}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedFields.includes("email")}
                    onCheckedChange={(c) => toggleField("email", Boolean(c))}
                  >
                    {FIELD_LABEL.email}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedFields.includes("phone")}
                    onCheckedChange={(c) => toggleField("phone", Boolean(c))}
                  >
                    {FIELD_LABEL.phone}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedFields.includes("projects")}
                    onCheckedChange={(c) => toggleField("projects", Boolean(c))}
                  >
                    {FIELD_LABEL.projects}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={selectedFields.includes("status")}
                    onCheckedChange={(c) => toggleField("status", Boolean(c))}
                  >
                    {FIELD_LABEL.status}
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                      Limpar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={selectedFields.length === allFields.length}
                    >
                      Selecionar tudo
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </Link>
              <Link to="/suppliers/new">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Fornecedor
                </Button>
              </Link>
            </div>
          </PageHeader>

          <Tabs defaultValue="clients" className="space-y-4">
            <TabsList>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            </TabsList>

            {/* CLIENTES (dados reais) */}
            <TabsContent value="clients">
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Lista de Clientes</CardTitle>
                  <CardDescription>Todos os clientes cadastrados no sistema</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {errorMsg && <div className="text-sm text-red-500">{errorMsg}</div>}

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Projetos</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6">
                              Carregando...
                            </TableCell>
                          </TableRow>
                        )}

                        {!loading && rows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6">
                              Nenhum cliente encontrado.
                            </TableCell>
                          </TableRow>
                        )}

                        {!loading &&
                          rows.map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  {c.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  {c.contactName || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {c.contactEmail || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {c.contactPhone || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                {typeof c.projectsCount === "number" ? c.projectsCount : 0}
                              </TableCell>
                              <TableCell>
                                <Badge variant={(c.status ?? "").toUpperCase() === "ATIVO" ? "default" : "secondary"}>
                                  {statusLabel(c.status)}
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
                                      <Link to={`/clients/${c.id}`} className="flex w-full">
                                        Ver detalhes
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to={`/clients/${c.id}/edit`} className="flex w-full">
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* paginação simples */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Página {(data?.number ?? 0) + 1} de {Math.max(totalPages, 1)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading || (data?.first ?? page === 0)}
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loading || (data?.last ?? page + 1 >= totalPages)}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* FORNECEDORES (placeholder) */}
            <TabsContent value="suppliers">
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Lista de Fornecedores</CardTitle>
                  <CardDescription>Em breve com dados reais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suppliers.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {s.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {s.contact}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {s.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {s.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={"default"}>{s.status}</Badge>
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
                                    <span>Ver detalhes</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <span>Editar</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
