import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/services/api";

type StatusDTO = "ATIVO" | "INATIVO" | "PROSPECTO";

export default function NewClientPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Selects controlados (não entram no FormData por padrão)
  const [status, setStatus] = useState<StatusDTO>("ATIVO");
  const [segment, setSegment] = useState<string>("");
  const [uf, setUf] = useState<string>(""); // UF ex: "SP"

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);

      // Mapeamento: IDs do form -> campos do DTO do backend
      const payload = {
        name: String(fd.get("company-name") || "").trim(),
        cnpj: String(fd.get("cnpj") || "").trim(),
        description: String(fd.get("description") || "").trim(),
        status,                     // "ATIVO" | "INATIVO" | "PROSPECTO"
        segment: segment || String(fd.get("segment") || "").trim(), // fallback se quiser
        addrStreet: String(fd.get("address") || "").trim(),
        addrNumber: String(fd.get("number") || "").trim(),
        addrComplement: String(fd.get("complement") || "").trim(),
        addrDistrict: String(fd.get("neighborhood") || "").trim(),
        addrZipcode: String(fd.get("cep") || "").trim(),
        addrCity: String(fd.get("city") || "").trim(),
        addrState: (uf || "").toUpperCase(), // "SP", "RJ", ...
        contactName: String(fd.get("contact-name") || "").trim(),
        contactRole: String(fd.get("position") || "").trim(),
        contactEmail: String(fd.get("email") || "").trim(),
        contactPhone: String(fd.get("phone") || "").trim(),
        contactNotes: String(fd.get("notes") || "").trim(),
      };

      // valida mínimos (ex.: name e contactEmail)
      if (!payload.name) throw new Error("Informe o nome da empresa.");
      if (!payload.contactEmail) throw new Error("Informe o e-mail do contato.");

      await apiFetch("/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      navigate("/clients");
    } catch (err: any) {
      console.error("Falha ao criar cliente:", err);
      alert(err?.message || "Não foi possível salvar o cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader title="Novo Cliente" description="Cadastre um novo cliente no sistema">
            <Link to="/clients">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações da Empresa */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Dados principais do cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nome da Empresa *</Label>
                    <Input id="company-name" name="company-name" placeholder="Ex: Empresa ABC Ltda" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição / Ramo de Atividade</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Descreva o ramo de atividade da empresa..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v.toUpperCase() as StatusDTO)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o segmento" />
                      </SelectTrigger>
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

            {/* Endereço */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Endereço da sede da empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input id="address" name="address" placeholder="Rua, Avenida..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" name="number" placeholder="123" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input id="complement" name="complement" placeholder="Sala, Andar..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input id="neighborhood" name="neighborhood" placeholder="Centro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" name="cep" placeholder="00000-000" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input id="city" name="city" placeholder="São Paulo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={uf} onValueChange={(v) => setUf(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        {/* adicione outros UFs se precisar */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato Principal */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Contato Principal</CardTitle>
                <CardDescription>Pessoa responsável pelo contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Nome do Contato *</Label>
                    <Input id="contact-name" name="contact-name" placeholder="João Silva" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input id="position" name="position" placeholder="Gerente de Projetos" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" placeholder="joao@empresa.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Informações adicionais sobre o contato..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
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
                    Cadastrar Cliente
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
