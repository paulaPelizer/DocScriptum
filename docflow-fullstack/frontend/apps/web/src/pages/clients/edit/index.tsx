// src/pages/clients/[id]/edit.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/services/api";

type StatusDTO = "ATIVO" | "INATIVO" | "PROSPECTO";

type ClientDTO = {
  id: number;
  name: string;
  cnpj?: string;
  description?: string;
  status: StatusDTO;
  segment?: string;
  addrStreet?: string;
  addrNumber?: string;
  addrComplement?: string;
  addrDistrict?: string;
  addrZipcode?: string;
  addrCity?: string;
  addrState?: string;
  contactName?: string;
  contactRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactNotes?: string;
};

export default function EditClientPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<ClientDTO | null>(null);

  const [status, setStatus] = useState<StatusDTO>("ATIVO");
  const [segment, setSegment] = useState<string>("");
  const [uf, setUf] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const data = await apiFetch(`/clients/${id}`);
        setClient(data);
        setStatus(data.status ?? "ATIVO");
        setSegment(data.segment ?? "");
        setUf(data.addrState ?? "");
      } catch (e) {
        alert("Falha ao carregar os dados do cliente.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;

    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);

      const payload = {
        name: String(fd.get("company-name") || "").trim(),
        cnpj: String(fd.get("cnpj") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        status,
        segment: segment || String(fd.get("segment") || "").trim(),
        addrStreet: String(fd.get("address") || "").trim(),
        addrNumber: String(fd.get("number") || "").trim(),
        addrComplement: String(fd.get("complement") || "").trim(),
        addrDistrict: String(fd.get("neighborhood") || "").trim(),
        addrZipcode: String(fd.get("cep") || "").trim(),
        addrCity: String(fd.get("city") || "").trim(),
        addrState: (uf || "").toUpperCase(),
        contactName: String(fd.get("contact-name") || "").trim(),
        contactRole: String(fd.get("position") || "").trim(),
        contactEmail: String(fd.get("email") || "").trim(),
        contactPhone: String(fd.get("phone") || "").trim(),
        contactNotes: String(fd.get("notes") || "").trim(),
      };

      await apiFetch(`/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      navigate("/clients");
    } catch (err: any) {
      alert(err?.message || "Erro ao salvar as alterações.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!client && isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando dados do cliente…</div>;
  }

  if (!client && !isLoading) {
    return <div className="p-6 text-sm text-red-600">Cliente não encontrado.</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader title="Editar Cliente" description="Atualize as informações do cliente">
            <Link to="/clients">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ======== CARD 1 – Empresa ======== */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Dados principais do cliente</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa *</Label>
                    <Input id="company-name" name="company-name" defaultValue={client?.name} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" name="cnpj" defaultValue={client?.cnpj || ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição / Ramo de Atividade</Label>
                  <Textarea id="description" name="description" defaultValue={client?.description || ""} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v.toUpperCase() as StatusDTO)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                        <SelectItem value="PROSPECTO">Prospecto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Segmento</Label>
                    <Select value={segment} onValueChange={setSegment}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Construção Civil">Construção Civil</SelectItem>
                        <SelectItem value="Indústria">Indústria</SelectItem>
                        <SelectItem value="Comércio">Comércio</SelectItem>
                        <SelectItem value="Serviços">Serviços</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ======== CARD 2 – Endereço ======== */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" name="address" defaultValue={client?.addrStreet} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" name="number" defaultValue={client?.addrNumber} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" name="complement" defaultValue={client?.addrComplement} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" name="neighborhood" defaultValue={client?.addrDistrict} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" name="cep" defaultValue={client?.addrZipcode} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" defaultValue={client?.addrCity} />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={uf} onValueChange={setUf}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ======== CARD 3 – Contato ======== */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>Contato Principal</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Nome do Contato *</Label>
                    <Input id="contact-name" name="contact-name" defaultValue={client?.contactName} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input id="position" name="position" defaultValue={client?.contactRole} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" defaultValue={client?.contactEmail} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" defaultValue={client?.contactPhone} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea id="notes" name="notes" defaultValue={client?.contactNotes} />
                </div>
              </CardContent>
            </Card>

            {/* ======== BOTÕES ======== */}
            <div className="flex justify-end gap-4">
              <Link to="/clients">
                <Button variant="outline">Cancelar</Button>
              </Link>

              <Button type="submit" disabled={isLoading} className="neon-border">
                {isLoading ? (
                  "Salvando..."
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
