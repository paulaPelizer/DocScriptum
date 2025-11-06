import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, X, Plus, Trash2 } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/services/api";
import type { Document, Disciplina, Milestone, User, ProjectData } from "@/types/project";

/** Se o backend já devolver disciplinas/milestones, depois a gente mapeia aqui. */
type ProjectApiDTO = {
  id: number;
  code?: string | null;
  name: string;
  description?: string | null;
  status?: string | null;
  startDate?: string | null;        // ISO ou "YYYY-MM-DD"
  plannedEndDate?: string | null;   // ISO ou "YYYY-MM-DD"
  clientId?: number | null;
  clientName?: string | null;
};

function toDateInput(iso?: string | null) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
  const d = new Date(String(iso));
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;

  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  // Dados básicos do projeto (mantendo seu ProjectData)
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    code: "",
    description: "",
    client: "",      // mantém string; depois podemos trocar para clientId se quiser
    status: "",
    startDate: "",
    endDate: "",     // mapeia plannedEndDate
  });

  // Disciplinas e marcos (mantidos conforme seu formulário atual)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Usuários disponíveis por grupo (mock local por enquanto)
  const [userGroups] = useState<Record<string, User[]>>({
    cliente: [
      { id: 1, name: "João Silva", email: "joao@empresaabc.com" },
      { id: 2, name: "Maria Santos", email: "maria@empresaabc.com" },
      { id: 3, name: "Carlos Oliveira", email: "carlos@empresaabc.com" },
    ],
    fornecedor: [
      { id: 4, name: "Ana Costa", email: "ana@construtoraXYZ.com" },
      { id: 5, name: "Pedro Mendes", email: "pedro@construtoraXYZ.com" },
      { id: 6, name: "Lucia Ferreira", email: "lucia@construtoraXYZ.com" },
    ],
    interno: [
      { id: 7, name: "Roberto Lima", email: "roberto@docflow.com" },
      { id: 8, name: "Sandra Costa", email: "sandra@docflow.com" },
      { id: 9, name: "Felipe Santos", email: "felipe@docflow.com" },
    ],
  });

  /** 🔙 Botão Voltar inteligente */
  const goBack = () => {
    if (from) {
      navigate(from, { replace: true });
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/projects");
    }
  };

  /** 🔄 CARREGAR DO BACKEND */
  useEffect(() => {
    if (!id) return;
    let cancel = false;

    (async () => {
      setIsLoading(true);
      try {
        const api: ProjectApiDTO & { milestones?: Milestone[]; documents?: any[] } =
          await apiFetch(`/projects/${id}/detail`);
        if (cancel) return;

        setProjectData({
          name: api.name ?? "",
          code: api.code ?? "",
          description: api.description ?? "",
          client: api.clientName ?? "",        // ou clientId se preferir id
          status: api.status ?? "",
          startDate: toDateInput(api.startDate),
          endDate: toDateInput(api.plannedEndDate),
        });

        if (api.milestones) setMilestones(api.milestones);

        if (api.documents) {
          const docsApi = Array.isArray(api.documents) ? api.documents : [];
          const disciplinasUnicas: string[] = Array.from(
            new Set(docsApi.map((d: any) => d?.type ?? "Sem Disciplina"))
          );

          setDisciplinas(
            disciplinasUnicas.map((nome: string, idx: number) => ({
              id: idx + 1,
              name: nome,
              documents: docsApi
                .filter((d: any) => (d?.type ?? "Sem Disciplina") === nome)
                .map((doc: any) => ({
                  id: doc?.id ?? Number(`${idx + 1}${Math.random().toString().slice(2, 6)}`),
                  name: doc?.title ?? doc?.code ?? "(sem título)",
                  dueDate: toDateInput(doc?.lastModified ?? null),
                })),
              destinatarios: { cliente: [], fornecedor: [], interno: [] },
            }))
          );
        }
      } catch (e) {
        console.error("Erro ao carregar projeto detail:", e);
        alert("Não foi possível carregar os dados do projeto.");
      } finally {
        if (!cancel) setIsLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [id]);

  /** 💾 SALVAR NO BACKEND */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        code: projectData.code?.trim() || "",
        name: projectData.name?.trim() || "",
        description: projectData.description?.trim() || "",
        status: projectData.status?.trim() || "",
        startDate: projectData.startDate?.trim() || null,      // "YYYY-MM-DD"
        plannedEndDate: projectData.endDate?.trim() || null,   // "YYYY-MM-DD"
      };

      if (!payload.name) throw new Error("Informe o nome do projeto.");

      await apiFetch(`/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // após salvar, volte para a origem (se houver) ou para a página de detalhes
      if (from) navigate(from, { replace: true });
      else navigate(`/projects/${id}`);
    } catch (error: any) {
      console.error("Erro ao atualizar projeto:", error);
      alert(error?.message || "Erro ao atualizar projeto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectData = (field: keyof ProjectData, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  // ---------- Disciplinas ----------
  const addDisciplina = () => {
    const newDisciplina: Disciplina = {
      id: Date.now(),
      name: "",
      documents: [],
      destinatarios: { cliente: [], fornecedor: [], interno: [] },
    };
    setDisciplinas((d) => [...d, newDisciplina]);
  };

  const removeDisciplina = (id: number) => {
    setDisciplinas((d) => d.filter((x) => x.id !== id));
  };

  const updateDisciplina = (id: number, field: keyof Disciplina, value: any) => {
    setDisciplinas((d) => d.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  // ---------- Documentos ----------
  const addDocument = (disciplinaId: number) => {
    setDisciplinas((d) =>
      d.map((disc) =>
        disc.id === disciplinaId
          ? { ...disc, documents: [...disc.documents, { id: Date.now(), name: "", dueDate: "" }] }
          : disc
      )
    );
  };

  const removeDocument = (disciplinaId: number, docId: number) => {
    setDisciplinas((d) =>
      d.map((disc) =>
        disc.id === disciplinaId ? { ...disc, documents: disc.documents.filter((doc) => doc.id !== docId) } : disc
      )
    );
  };

  const updateDocument = (disciplinaId: number, docId: number, field: keyof Document, value: string) => {
    setDisciplinas((d) =>
      d.map((disc) =>
        disc.id === disciplinaId
          ? {
              ...disc,
              documents: disc.documents.map((doc) => (doc.id === docId ? { ...doc, [field]: value } : doc)),
            }
          : disc
      )
    );
  };

  // ---------- Destinatários ----------
  const toggleDestinatario = (
    disciplinaId: number,
    groupType: keyof Disciplina["destinatarios"],
    userId: number
  ) => {
    setDisciplinas((d) =>
      d.map((disc) => {
        if (disc.id !== disciplinaId) return disc;
        const current = disc.destinatarios[groupType] || [];
        const next = current.includes(userId) ? current.filter((x) => x !== userId) : [...current, userId];
        return { ...disc, destinatarios: { ...disc.destinatarios, [groupType]: next } };
      })
    );
  };

  // ---------- Milestones ----------
  const addMilestone = () => {
    setMilestones((m) => [...m, { id: Date.now(), name: "", description: "", dueDate: "" }]);
  };

  const removeMilestone = (id: number) => {
    setMilestones((m) => m.filter((x) => x.id !== id));
  };

  const updateMilestone = (id: number, field: keyof Milestone, value: string) => {
    setMilestones((m) => m.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  // ---------- Render ----------
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader title="Editar Projeto" description="Altere as informações do projeto">
            <Button variant="outline" type="button" onClick={goBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </PageHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Dados principais do projeto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Projeto *</Label>
                    <Input
                      id="name"
                      value={projectData.name}
                      onChange={(e) => updateProjectData("name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código do Projeto</Label>
                    <Input
                      id="code"
                      value={projectData.code}
                      onChange={(e) => updateProjectData("code", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    className="min-h-[100px]"
                    value={projectData.description}
                    onChange={(e) => updateProjectData("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <Select
                      value={projectData.client}
                      onValueChange={(v) => updateProjectData("client", v)}
                      required
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {/* TODO: popular via GET /clients depois */}
                        <SelectItem value="empresa-abc">Empresa ABC</SelectItem>
                        <SelectItem value="construtora-xyz">Construtora XYZ</SelectItem>
                        <SelectItem value="industria-123">Indústria 123</SelectItem>
                        <SelectItem value="empresa-def">Empresa DEF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={projectData.status} onValueChange={(v) => updateProjectData("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="em-andamento">Em Andamento</SelectItem>
                        <SelectItem value="em-revisao">Em Revisão</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Data de Início</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={projectData.startDate}
                      onChange={(e) => updateProjectData("startDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Data Prevista de Conclusão</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={projectData.endDate}
                      onChange={(e) => updateProjectData("endDate", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disciplinas e Documentos */}
            <Card className="neon-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Disciplinas e Documentos</CardTitle>
                    <CardDescription>Configure as disciplinas do projeto, seus documentos e destinatários</CardDescription>
                  </div>
                  <Button type="button" onClick={addDisciplina} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Disciplina
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {disciplinas.map((disciplina, index) => (
                  <div key={disciplina.id} className="border-2 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Disciplina {index + 1}</h3>
                      {disciplinas.length > 1 && (
                        <Button type="button" onClick={() => removeDisciplina(disciplina.id)} variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Nome da Disciplina */}
                    <div className="space-y-2">
                      <Label>Nome da Disciplina</Label>
                      <Select
                        value={disciplina.name}
                        onValueChange={(v) => updateDisciplina(disciplina.id, "name", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Civil">Civil</SelectItem>
                          <SelectItem value="Elétrica">Elétrica</SelectItem>
                          <SelectItem value="Hidráulica">Hidráulica</SelectItem>
                          <SelectItem value="Automação">Automação</SelectItem>
                          <SelectItem value="Estrutural">Estrutural</SelectItem>
                          <SelectItem value="Arquitetura">Arquitetura</SelectItem>
                          <SelectItem value="HVAC">HVAC</SelectItem>
                          <SelectItem value="Segurança">Segurança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Documentos da Disciplina */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Documentos da Disciplina</Label>
                        <Button type="button" onClick={() => addDocument(disciplina.id)} variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Documento
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {disciplina.documents.map((document) => (
                          <div key={document.id} className="flex gap-2 items-center">
                            <Input
                              placeholder="Nome do documento"
                              value={document.name}
                              onChange={(e) => updateDocument(disciplina.id, document.id, "name", e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              type="date"
                              value={document.dueDate}
                              onChange={(e) => updateDocument(disciplina.id, document.id, "dueDate", e.target.value)}
                              className="w-40"
                            />
                            {disciplina.documents.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeDocument(disciplina.id, document.id)}
                                variant="ghost"
                                size="sm"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Destinatários da Disciplina */}
                    <div className="space-y-3">
                      <Label>Destinatários da Disciplina</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(userGroups).map(([groupType, users]) => (
                          <div key={groupType} className="space-y-2">
                            <Label className="text-sm font-medium capitalize">{groupType}</Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                              {users.map((user) => (
                                <div key={user.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`disciplina-${disciplina.id}-${groupType}-${user.id}`}
                                    checked={
                                      disciplina.destinatarios[
                                        groupType as keyof Disciplina["destinatarios"]
                                      ]?.includes(user.id) || false
                                    }
                                    onCheckedChange={() =>
                                      toggleDestinatario(
                                        disciplina.id,
                                        groupType as keyof Disciplina["destinatarios"],
                                        user.id
                                      )
                                    }
                                  />
                                  <Label htmlFor={`disciplina-${disciplina.id}-${groupType}-${user.id}`} className="text-xs">
                                    {user.name}
                                    <br />
                                    <span className="text-muted-foreground">{user.email}</span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Marcos Contratuais */}
            <Card className="neon-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Marcos Contratuais</CardTitle>
                    <CardDescription>Defina os marcos e datas limite para entrega dos documentos</CardDescription>
                  </div>
                  <Button type="button" onClick={addMilestone} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Marco
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Marco {index + 1}</h4>
                      {milestones.length > 1 && (
                        <Button type="button" onClick={() => removeMilestone(milestone.id)} variant="ghost" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Marco</Label>
                        <Input
                          placeholder="Ex: Entrega Inicial"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(milestone.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Limite</Label>
                        <Input
                          type="date"
                          value={milestone.dueDate}
                          onChange={(e) => updateMilestone(milestone.id, "dueDate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descreva os documentos e requisitos deste marco..."
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={goBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="neon-border">
                {isLoading ? (
                  "Salvando Alterações..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
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
