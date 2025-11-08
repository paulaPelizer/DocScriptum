import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { apiGet, apiPost, apiPut } from "@/services/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ArrowLeft, Save, Upload } from "lucide-react";

export default function NewDocumentPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const isEdit = !!routeId; // ✅ só por ID

  type ProjectSummary = { id: number; code: string; name: string };
  type Discipline = { id: number; code?: string; name: string };
  type DocType = { id: string; code?: string; name: string; disciplineId?: number };
  type SimpleIdName = { id: number; name: string };

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);

  // cliente e id (p/ POST/PUT)
  const [client, setClient] = useState<SimpleIdName | null>(null);
  const [clientIdForPost, setClientIdForPost] = useState<number | null>(null);

  const [projectId, setProjectId] = useState<number | null>(null);
  const [disciplineId, setDisciplineId] = useState<number | null>(null);
  const [docTypeId, setDocTypeId] = useState<string>("");

  // guarda o documento carregado p/ selecionar disciplina/tipo depois do form-data
  const [prefill, setPrefill] = useState<any | null>(null);

  // --- campos controlados ---
  const [codeV, setCodeV] = useState("");
  const [nameV, setNameV] = useState("");
  const [revisionV, setRevisionV] = useState("Rev. 0");
  const [speciesV, setSpeciesV] = useState("");
  const [pagesV, setPagesV] = useState<string>("");
  const [descriptionV, setDescriptionV] = useState("");
  const [responsibleV, setResponsibleV] = useState("");
  const [doneISOv, setDoneISOv] = useState<string>("");
  const [dueISOv, setDueISOv] = useState<string>("");
  const [remarksV, setRemarksV] = useState("");

  const layoutOptions = [
    { id: "iso-a", name: "ISO A (engenharia)" },
    { id: "iso-b", name: "ISO B (arquitetura)" },
    { id: "free",  name: "Livre (custom)" },
  ];
  const templateOptions = [
    { id: "tpl-001", name: "Template Padrão" },
    { id: "tpl-002", name: "Template Executivo" },
    { id: "tpl-003", name: "Template Técnico" },
  ];
  const [layoutId, setLayoutId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [isLoading, setIsLoading] = useState(false);

  type StatusUI = "em-elaboracao" | "em-revisao" | "aguardando-aprovacao" | "aprovado";
  type LocationUI = "interno" | "cliente" | "fornecedor";

  const [status, setStatus] = useState<StatusUI>("em-elaboracao");
  const [location, setLocation] = useState<LocationUI>("interno");
  const [formatValue, setFormatValue] = useState<string>("");
  const [disciplineLabel, setDisciplineLabel] = useState<string>("");
  const [docTypeLabel, setDocTypeLabel] = useState<string>("");

  // --- upload de arquivo / metadados automáticos ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const mapStatus = (v: StatusUI) =>
    v === "em-elaboracao" ? "Em Elaboração" :
    v === "em-revisao" ? "Em Revisão" :
    v === "aguardando-aprovacao" ? "Aguardando Aprovação" :
    "Aprovado";

  const uiFromStatus = (s?: string | null): StatusUI => {
    const v = (s ?? "").toLowerCase();
    if (v.includes("revis")) return "em-revisao";
    if (v.includes("aguard") && v.includes("aprova")) return "aguardando-aprovacao";
    if (v.includes("aprova")) return "aprovado";
    return "em-elaboracao";
  };

  const mapLocation = (v: LocationUI) =>
    v === "interno" ? "Interno" :
    v === "cliente" ? "Cliente" :
    "Fornecedor";

  const uiFromLocation = (s?: string | null): LocationUI => {
    const v = (s ?? "").toLowerCase();
    if (v.includes("forne")) return "fornecedor";
    if (v.includes("clien")) return "cliente";
    return "interno";
  };

  const isoToBR = (iso?: string | null) => {
    if (!iso) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
      const [y, m, d] = iso.slice(0,10).split("-");
      return `${d}/${m}/${y}`;
    }
    return iso;
  };

  const toNum = (v: any): number | null => {
    if (v == null) return null;
    const n = typeof v === "string" ? v.trim() : v;
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const setInputValue = (id: string, value?: string | number | null) => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el) el.value = value == null ? "" : String(value);
  };

  const normalizeProjectObject = (resp: any, selId: number | null) => {
    if (!resp) return null;
    if (resp.id || resp.code || resp.name) return resp;
    if (resp.project) return resp.project;
    if (resp.data && (resp.data.id || resp.data.project)) return (resp.data.project ?? resp.data);
    const list = resp.content ?? resp.items ?? resp.results ?? [];
    if (Array.isArray(list) && list.length) {
      if (selId != null) {
        const byId = list.find((x: any) => Number(x?.id) === Number(selId));
        if (byId) return byId;
      }
      return list[0];
    }
    return resp;
  };

  const extractClientIdFromProject = (p: any): number | null => {
    if (!p) return null;
    const candidates = [
      p.clientId, p.client_id, p.projectClientId,
      p.organizationId, p.customerId,
      p?.client?.id, p?.organization?.id, p?.customer?.id,
      p?.fields?.clientId, p?.meta?.clientId,
    ];
    for (const c of candidates) {
      const n = toNum(c);
      if (n && n > 0) return n;
    }
    return null;
  };

  function extractClient(detail: any): SimpleIdName | null {
    const objCandidates: any[] = [
      detail?.client, detail?.project?.client,
      detail?.organization, detail?.project?.organization,
      detail?.account, detail?.project?.account,
      Array.isArray(detail?.clients) ? detail.clients[0] : null,
      Array.isArray(detail?.project?.clients) ? detail.project.clients[0] : null,
      Array.isArray(detail?.organizations) ? detail.organizations[0] : null,
      Array.isArray(detail?.project?.organizations) ? detail.project.organizations[0] : null,
      detail?.project?.customer,
    ].filter(Boolean);

    const normalize = (c: any): SimpleIdName | null => {
      const rawId = Number(c?.id ?? c?.clientId ?? c?.organizationId ?? c?.accountId ?? c?.customerId ?? NaN);
      const name = String(
        c?.name ?? c?.clientName ?? c?.organizationName ?? c?.accountName ?? c?.customerName ?? c?.legalName ?? c?.displayName ?? ""
      ).trim();
      if (!name) return null;
      if (Number.isFinite(rawId) && rawId > 0) return { id: rawId, name };
      return { id: -1, name };
    };

    for (const c of objCandidates) {
      const n = normalize(c);
      if (n) return n;
    }

    const flatName = String(
      detail?.clientName ?? detail?.project?.clientName ?? detail?.organizationName ??
      detail?.project?.organizationName ?? detail?.customerName ?? detail?.project?.customerName ?? ""
    ).trim();

    const flatId = Number(
      detail?.clientId ?? detail?.project?.clientId ?? detail?.organizationId ??
      detail?.project?.organizationId ?? detail?.customerId ?? detail?.project?.customerId ?? NaN
    );

    if (flatName) {
      if (Number.isFinite(flatId) && flatId > 0) return { id: flatId, name: flatName };
      return { id: -1, name: flatName };
    }

    const nestedId = Number(
      detail?.project?.client?.id ?? detail?.project?.organization?.id ?? detail?.project?.customer?.id ?? NaN
    );
    const nestedName = String(
      detail?.project?.client?.name ?? detail?.project?.organization?.name ?? detail?.project?.customer?.name ?? ""
    ).trim();

    if (nestedName) {
      if (Number.isFinite(nestedId) && nestedId > 0) return { id: nestedId, name: nestedName };
      return { id: -1, name: nestedName };
    }
    return null;
  }

  // ---------- SUGESTÃO DE METADADOS A PARTIR DO NOME DO ARQUIVO ----------

  function suggestMetadataFromFileName(fileName: string) {
    // tira caminho e extensão
    const justName = fileName.split("\\").pop() || fileName;
    const baseName = justName.replace(/\.[^.]+$/, ""); // sem extensão

    // tenta achar padrão de revisão no final: ..._REV01, ...-rev 2, etc.
    let revisionLabel: string | null = null;
    let titleBase = baseName;

    const revMatch = baseName.match(/(?:^|[_\-\s])rev\.?\s*([0-9]+)$/i);
    if (revMatch) {
      const num = revMatch[1];
      revisionLabel = `Rev. ${num}`;
      // remove o trecho de revisão do título base
      titleBase = baseName.slice(0, revMatch.index).replace(/[_\-\s]+$/, "");
    }

    // título humano: substitui _ e - por espaço
    const humanTitle = titleBase.replace(/[_\-]+/g, " ").trim();

    // código sugerido: usa o próprio baseName em maiúsculas
    const codeSuggestion = baseName.toUpperCase();

    return {
      code: codeSuggestion,
      title: humanTitle || baseName,
      revision: revisionLabel,
    };
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const meta = suggestMetadataFromFileName(file.name);

    // Só preenche automaticamente se o campo ainda estiver vazio
    setCodeV((prev) => prev || meta.code || prev);
    setNameV((prev) => prev || meta.title || prev);

    if (meta.revision) {
      setRevisionV(meta.revision);
    }

    // como é arquivo digital importado, já podemos sugerir "Digital"
    if (!formatValue) {
      setFormatValue("Digital");
    }
  };

  // Carregar projetos (combo)
  useEffect(() => {
    (async () => {
      try {
        const resp = await apiGet("/api/v1/projects");
        const items = Array.isArray(resp) ? resp : (resp?.content ?? resp?.items ?? []);
        const mapped: ProjectSummary[] = (items ?? []).map((p: any) => ({
          id: Number(p.id),
          code: String(p.code ?? ""),
          name: String(p.name ?? ""),
        }));
        setProjects(mapped);
      } catch (e) {
        console.error("Erro ao carregar projetos:", e);
      }
    })();
  }, []);

  // Ao mudar projeto, buscar form-data e cliente do projeto
  useEffect(() => {
    if (!projectId) {
      setDisciplines([]); setDocTypes([]); setDisciplineId(null); setDocTypeId("");
      setClient(null); setClientIdForPost(null);
      return;
    }
    (async () => {
      try {
        const f = await apiGet(`/api/v1/documents/form-data?projectId=${projectId}`);

        const dDisc: Discipline[] = (f?.disciplines ?? []).map((d: any, idx: number) => ({
          id: Number(d?.id ?? d?.disciplineId ?? idx + 1),
          code: d?.code,
          name: String(d?.name ?? d?.disciplineName ?? "").trim() || `Disciplina #${idx + 1}`,
        })).filter((d: Discipline) => d.id && d.name);
        setDisciplines(dDisc);

        const dTypes: DocType[] = (f?.docTypes ?? []).map((t: any) => ({
          id: String(Number(t?.id ?? t?.documentTypeId)),
          code: t?.code ?? String(t?.name ?? ""),
          name: String(t?.name ?? t?.title ?? "").trim(),
          disciplineId: t?.disciplineId != null ? Number(t.disciplineId) : undefined,
        })).filter((t: DocType) => !!t.name && /^\d+$/.test(t.id));
        setDocTypes(dTypes);

        // cliente/detalhe do projeto
        const detail = await apiGet(`/api/v1/projects/${projectId}/detail`);
        const cli = extractClient(detail);
        if (cli) setClient({ id: cli.id, name: cli.name }); else setClient(null);

        const projResp = await apiGet(`/api/v1/projects/${projectId}`);
        const p = normalizeProjectObject(projResp, projectId);
        const clientIdFromProject = extractClientIdFromProject(p);
        setClientIdForPost(clientIdFromProject ?? null);

        if (!cli) {
          const nameFromProject =
            p?.client?.name ?? p?.organization?.name ?? p?.customer?.name ??
            p?.clientName ?? p?.organizationName ?? p?.customerName;
          if (nameFromProject) {
            setClient({ id: clientIdFromProject ?? -1, name: String(nameFromProject) });
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dados do projeto:", e);
        setDisciplines([]); setDocTypes([]); setClient(null); setClientIdForPost(null);
      }
    })();
  }, [projectId]);

  // --- MODO EDIÇÃO: sempre por ID
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const d = await apiGet(`/api/v1/documents/${routeId}`);
        setPrefill(d);

        // ids (para selects)
        if (d?.disciplineId != null) setDisciplineId(Number(d.disciplineId));
        if (d?.documentTypeId != null) setDocTypeId(String(d.documentTypeId));

        // rótulos (fallback)
        setDisciplineLabel(String(d?.discipline?.name ?? d?.disciplineName ?? "").trim());
        setDocTypeLabel(String(d?.documentType?.name ?? d?.documentTypeName ?? "").trim());

        const pid = Number(d?.project?.id ?? d?.projectId ?? 0) || null;
        setProjectId(pid);

        setCodeV(d?.code ?? "");
        setNameV(d?.title ?? d?.name ?? "");
        setRevisionV(d?.revision ? `Rev. ${d.revision}` : "Rev. 0");
        setSpeciesV(d?.species ?? "");
        setPagesV(d?.pages != null ? String(d.pages) : "");
        setDescriptionV(d?.description ?? "");
        setResponsibleV(d?.technicalResponsible ?? d?.responsible ?? "");

        const performedISO = (d?.performedDate ?? "").slice(0,10);
        const dueISO       = (d?.dueDate ?? "").slice(0,10);
        setDoneISOv(performedISO || "");
        setDueISOv(dueISO || "");

        setStatus(uiFromStatus(d?.status));
        setLocation(uiFromLocation(d?.currentLocation));
        setFormatValue(d?.format ?? "");
        setRemarksV(d?.remarks ?? "");
      } catch (e) {
        console.error("Falha ao carregar documento por ID:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, routeId]);

  // quando form-data chegar e houver prefill, garantir seleção e injetar opções sintéticas
  useEffect(() => {
    if (!prefill || !projectId) return;

    // DISCIPLINA
    if (prefill.disciplineId != null) {
      const dId = Number(prefill.disciplineId);
      const inList = disciplines.some(d => Number(d.id) === dId);
      if (!inList && (disciplineLabel || dId)) {
        setDisciplines(prev => [
          { id: dId, name: disciplineLabel || `Disciplina ${dId}` },
          ...prev,
        ]);
      }
      setDisciplineId(dId);
    }

    // TIPO DE DOCUMENTO
    if (prefill.documentTypeId != null) {
      const tId = String(prefill.documentTypeId);
      const inList = docTypes.some(t => String(t.id) === tId);
      if (!inList && (docTypeLabel || tId)) {
        setDocTypes(prev => [
          {
            id: tId,
            code: prefill.documentTypeCode ?? docTypeLabel ?? tId,
            name: docTypeLabel || prefill.documentTypeName || prefill.documentTypeCode || `Tipo ${tId}`,
          },
          ...prev,
        ]);
      }
      setDocTypeId(tId);
    } else if (prefill.documentTypeName && docTypes.length) {
      const t = docTypes.find(
        x => x.name?.toLowerCase() === String(prefill.documentTypeName).toLowerCase()
      );
      if (t) setDocTypeId(t.id);
    }
  }, [prefill, projectId, disciplines, docTypes, disciplineLabel, docTypeLabel]);

  const availableDocTypes = docTypes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!projectId) throw new Error("Selecione um projeto.");

      const code = codeV.trim();
      const title = nameV.trim();
      const revision = (revisionV || "0")
        .replace(/^rev\.?\s*/i, "")
        .replace(/^Rev\.?\s*/i, "")
        .trim() || "0";

      if (!code) throw new Error("Informe o código do documento.");
      if (!title) throw new Error("Informe o nome do documento.");

      const species = speciesV.trim() || null;
      const pages = pagesV ? Number(pagesV) : null;
      const description = descriptionV.trim() || null;
      const responsible = responsibleV.trim() || null;
      const doneISO = doneISOv || null;
      const dueISO  = dueISOv  || null;
      const remarks = remarksV.trim() || null;

      const docTypeIdNum = /^\d+$/.test(docTypeId) ? Number(docTypeId) : null;
      const clientIdSafe = clientIdForPost && clientIdForPost > 0 ? clientIdForPost : null;

      const payload: any = {
        projectId: Number(projectId),
        code,
        title,
        revision,
        disciplineId: disciplineId ?? null,
        documentTypeId: docTypeIdNum,

        clientId: clientIdSafe, client_id: clientIdSafe,
        organizationId: clientIdSafe, customerId: clientIdSafe, projectClientId: clientIdSafe,

        format: formatValue || null,
        pages,
        fileUrl: null,

        species,
        description,

        technical_responsable: responsible,
        technicalResponsible: responsible,
        technicalResponsable: responsible,
        responsibleTechnical: responsible,
        responsible: responsible,

        performedDate: isoToBR(doneISO),
        dueDate: isoToBR(dueISO),

        status: mapStatus(status),
        currentLocation: mapLocation(location),
        remarks,

        layoutRef: layoutId || null,
        templateId: (() => {
          const m = String(templateId || "").match(/(\d+)/);
          return m ? Number(m[1]) : null;
        })(),
        // ❌ NADA de uploadHash aqui – backend cuida disso
      };

      setIsLoading(true);
      if (isEdit) {
        const targetId = routeId || prefill?.id;
        await apiPut(`/api/v1/documents/${targetId}`, payload);
      } else {
        await apiPost("/api/v1/documents", payload);
      }
      navigate("/documents");
    } catch (err: any) {
      console.error("Falha ao salvar documento:", err);
      alert(err?.message || "Não foi possível salvar o documento.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-5xl">
          <PageHeader
            title={isEdit ? "Editar Documento" : "Novo Documento"}
            description={isEdit ? "Atualize os dados do documento" : "Cadastre um novo documento no sistema"}
          >
            <Link to="/documents">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          {/* 1) Projeto e Classificação */}
          <Card className="neon-border mb-6">
            <CardHeader>
              <CardTitle>Projeto e Classificação</CardTitle>
              <CardDescription>Selecione o projeto, a disciplina e o tipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Projeto */}
                <div className="space-y-2 md:col-span-3">
                  <Label>Projeto *</Label>
                  <Select value={projectId ? String(projectId) : ""} onValueChange={(v) => setProjectId(Number(v))}>
                    <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                    <SelectContent>
                      {projects.length ? (
                        projects.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.code} — {p.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none" disabled>Nenhum projeto encontrado</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Disciplina */}
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <Select
                    value={disciplineId ? String(disciplineId) : ""}
                    onValueChange={(v) => setDisciplineId(Number(v))}
                    disabled={!projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={projectId ? "Selecione uma disciplina" : "Selecione um projeto"} />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplines.length ? (
                        disciplines.map(d => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none" disabled>
                          {disciplineLabel ? `Carregado: ${disciplineLabel}` : "Nenhuma disciplina disponível"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Documento */}
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={docTypeId}
                    onValueChange={setDocTypeId}
                    disabled={!projectId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !projectId
                            ? "Selecione um projeto"
                            : (availableDocTypes.length
                                ? "Selecione um tipo"
                                : (docTypeLabel ? `Carregado: ${docTypeLabel}` : "Nenhum tipo disponível"))
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDocTypes.length ? (
                        availableDocTypes.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none" disabled>
                          {docTypeLabel ? `Carregado: ${docTypeLabel}` : "Nenhum tipo disponível"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Layout */}
                <div className="space-y-2">
                  <Label>Layout (ISO/Referência)</Label>
                  <Select value={layoutId} onValueChange={setLayoutId} disabled={!projectId}>
                    <SelectTrigger><SelectValue placeholder={projectId ? "Selecione um layout" : "Selecione um projeto"} /></SelectTrigger>
                    <SelectContent>
                      {layoutOptions.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template */}
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={templateId} onValueChange={setTemplateId} disabled={!projectId}>
                    <SelectTrigger><SelectValue placeholder={projectId ? "Selecione um template" : "Selecione um projeto"} /></SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 2) Responsabilidade */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Responsabilidade</CardTitle>
                <CardDescription>Defina quem é responsável pelo documento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="responsible">Responsável Técnico</Label>
                    <Input
                      id="responsible"
                      value={responsibleV}
                      onChange={(e) => setResponsibleV(e.target.value)}
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="client">Cliente do Projeto</Label>
                    <Input id="client" value={client?.name ?? "—"} readOnly disabled />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="clientId">ID do Cliente (project)</Label>
                    <Input id="clientId" value={clientIdForPost ?? ""} readOnly disabled placeholder="—" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="done-date">Data Realizado</Label>
                    <Input
                      id="done-date"
                      type="date"
                      value={doneISOv}
                      onChange={(e) => setDoneISOv(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Data Prevista</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueISOv}
                      onChange={(e) => setDueISOv(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3) Status e Localização */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Status e Localização</CardTitle>
                <CardDescription>Defina o status inicial e localização do documento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status Inicial</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as StatusUI)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em-elaboracao">Em Elaboração</SelectItem>
                        <SelectItem value="em-revisao">Em Revisão</SelectItem>
                        <SelectItem value="aguardando-aprovacao">Aguardando Aprovação</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Localização Atual</Label>
                    <Select value={location} onValueChange={(v) => setLocation(v as LocationUI)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interno">Interno</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="fornecedor">Fornecedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={remarksV}
                    onChange={(e) => setRemarksV(e.target.value)}
                    placeholder="Observações sobre o documento..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 4) Upload de Arquivo */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Upload de Arquivo</CardTitle>
                <CardDescription>Faça upload do arquivo do documento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* input real (escondido) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.dwg,.dxf,.jpg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Arraste e solte o arquivo aqui</h3>
                    <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar um arquivo</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Selecionar Arquivo
                    </Button>

                    {selectedFileName && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Arquivo selecionado: <span className="font-medium">{selectedFileName}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Formatos aceitos: PDF, DWG, DXF, JPG, PNG</p>
                  <p>Tamanho máximo: 50MB</p>
                </div>
              </CardContent>
            </Card>

            {/* 5) Informações do Documento */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Informações do Documento</CardTitle>
                <CardDescription>Dados principais do documento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código do Documento *</Label>
                    <Input
                      id="code"
                      value={codeV}
                      onChange={(e) => setCodeV(e.target.value)}
                      placeholder="Ex: DOC-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revision">Revisão</Label>
                    <Input
                      id="revision"
                      value={revisionV}
                      onChange={(e) => setRevisionV(e.target.value)}
                      placeholder="Ex: Rev. 1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Documento *</Label>
                  <Input
                    id="name"
                    value={nameV}
                    onChange={(e) => setNameV(e.target.value)}
                    placeholder="Ex: Planta Baixa - Térreo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="species">Espécie de Documento</Label>
                  <Input
                    id="species"
                    value={speciesV}
                    onChange={(e) => setSpeciesV(e.target.value)}
                    placeholder="Ex: Relatório, Desenho, Memorial, Planilha..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select value={formatValue} onValueChange={setFormatValue}>
                      <SelectTrigger><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A0">A0</SelectItem>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="Digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pages">Número de Páginas</Label>
                    <Input
                      id="pages"
                      type="number"
                      min={0}
                      value={pagesV}
                      onChange={(e) => setPagesV(e.target.value)}
                      placeholder="Ex: 12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={descriptionV}
                    onChange={(e) => setDescriptionV(e.target.value)}
                    placeholder="Descreva o documento..."
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link to="/documents">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="neon-border">
                {isLoading ? "Salvando..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Salvar Alterações" : "Cadastrar Documento"}
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
