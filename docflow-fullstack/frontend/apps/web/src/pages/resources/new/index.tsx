import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { apiPost } from "@/services/api";
import { Mail, Phone, Building2, UserPlus, Save, ArrowLeft, Hash } from "lucide-react";

type OrgType = "client" | "supplier" | "internal";

type FormState = {
  name: string;
  role: string;
  email: string;
  phone: string;
  orgType: OrgType;
  orgName: string;
  status: "Ativo" | "Inativo";
  tags: string[];
  notes: string;
};

const INITIAL: FormState = {
  name: "",
  role: "",
  email: "",
  phone: "",
  orgType: "client",
  orgName: "",
  status: "Ativo",
  tags: [],
  notes: "",
};

export default function ResourceNewPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(INITIAL);
  const [tagDraft, setTagDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // helpers
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    setForm((p) => ({ ...p, tags: Array.from(new Set([...p.tags, t])) }));
    setTagDraft("");
  };
  const removeTag = (t: string) => setForm((p) => ({ ...p, tags: p.tags.filter((x) => x !== t) }));

  // validação simples
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Informe o nome.";
    if (!form.role.trim()) e.role = "Informe o papel/função.";
    if (!form.email.trim()) e.email = "Informe o e-mail.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "E-mail inválido.";
    if (!form.orgName.trim()) e.orgName = "Informe o nome da parceria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // payload alinhado aos campos usados na listagem
      const payload = {
        name: form.name,
        role: form.role,
        email: form.email,
        phone: form.phone || null,
        orgType: form.orgType,
        orgName: form.orgName,
        status: form.status,
        tags: form.tags,
        notes: form.notes || null,
      };

      // ajuste o endpoint conforme seu backend
      await apiPost("/api/v1/resources", payload);

      navigate("/resources");
    } catch (err) {
      console.error(err);
      // feedback mínimo
      setErrors((p) => ({ ...p, name: (p.name as any) || "Falha ao salvar. Tente novamente." }));
    } finally {
      setSubmitting(false);
    }
  };

  const orgTypeLabel = useMemo(
    () => (form.orgType === "client" ? "Cliente" : form.orgType === "supplier" ? "Fornecedor" : "Interno"),
    [form.orgType]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <PageHeader
            title="Novo Recurso"
            description="Cadastre usuários/contatos para clientes, fornecedores ou equipe interna"
          >
            <div className="flex gap-2 w-full md:w-auto">
              <Link to="/resources">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <Button className="neon-border" form="resource-form" type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </PageHeader>

          <Card className="neon-border">
            <CardHeader>
              <CardTitle>Dados do Recurso</CardTitle>
              <CardDescription>Preencha as informações principais do contato</CardDescription>
            </CardHeader>

            <CardContent>
              <form id="resource-form" className="space-y-6" onSubmit={onSubmit}>
                {/* Linha 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Ex.: Ana Souza"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="role">Papel / Função</Label>
                    <Input
                      id="role"
                      placeholder="Ex.: Doc Control, Eng. Projetista"
                      value={form.role}
                      onChange={(e) => set("role", e.target.value)}
                    />
                    {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" /> E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@empresa.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" /> Telefone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="orgType" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" /> Tipo de Parceria
                    </Label>
                    <Select value={form.orgType} onValueChange={(v) => set("orgType", v as OrgType)}>
                      <SelectTrigger id="orgType">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="supplier">Fornecedor</SelectItem>
                        <SelectItem value="internal">Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Linha 3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="orgName" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" /> Nome da Parceria ({orgTypeLabel})
                    </Label>
                    <Input
                      id="orgName"
                      placeholder="Ex.: Empresa ABC"
                      value={form.orgName}
                      onChange={(e) => set("orgName", e.target.value)}
                    />
                    {errors.orgName && <p className="text-xs text-red-500 mt-1">{errors.orgName}</p>}
                  </div>

                  <div>
                    <Label htmlFor="tags" className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" /> Tags
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Digite e pressione Enter"
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        Adicionar
                      </Button>
                    </div>
                    {form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeTag(t)}>
                            {t} ✕
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Observações (opcional) */}
                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais, preferências de contato, horários, etc."
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Link to="/resources">
                    <Button variant="outline">Cancelar</Button>
                  </Link>
                  <Button className="neon-border" type="submit" disabled={submitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {submitting ? "Salvando..." : "Salvar Recurso"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
