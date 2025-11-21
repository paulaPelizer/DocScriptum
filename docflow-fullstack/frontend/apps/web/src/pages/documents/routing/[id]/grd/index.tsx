import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Download,
  Printer,
  FileText,
  Building,
  Calendar,
  User,
} from "lucide-react"
import { Link } from "react-router-dom"
import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"

export default function GRDViewPage() {
  // ===== DADOS MOKADOS ALINHADOS À TABELA DE TIPOS DOCUMENTAIS / TEMPORALIDADE =====
  const grd = {
    number: "GRD-TTD-ALPHA-2025-001",
    date: "20/05/2025",
    protocol: "PRT-2025-004210",
    project: "Projeto Alpha – Subestação 230kV",
    origin: {
      name: "DOCScriptum / Doc Control",
      type: "Interno",
      contact: "Paula Dantas – Coordenação de Documentos",
      email: "doccontrol@docscriptum.app",
      phone: "(11) 4000-2300",
      address: "Centro de Engenharia de Documentos – São Paulo/SP",
    },
    destination: {
      name: "Empresa ABC Energia",
      type: "Cliente",
      contact: "João Batista – Eng. Fiscal",
      email: "joao.batista@abcenergia.com",
      phone: "(11) 98888-1122",
      address: "Av. Paulista, 1500 – Bela Vista – São Paulo/SP",
    },
    purpose:
      "Envio de conjunto documental alinhado à Tabela de Temporalidade do DOCScriptum, para análise, aceite contratual e guarda arquivística.",
    deliveryMethod: "Upload pelo Portal DOCScriptum (GRD eletrônica)",
    documents: [
      // 1) Gestão de Documentos e Protocolo
      {
        id: 1,
        code: "GRD-REM-001",
        name: "GRD de Remessa de Documentação – Marco 2",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 4,
      },
      {
        id: 2,
        code: "AR-REC-002",
        name: "AR de Recebimento – Confirmação Cliente",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 2,
      },
      {
        id: 3,
        code: "TER-DEV-003",
        name: "Termo de Devolução de Documentos – Revisão Projeto Básico",
        revision: "Rev. 1",
        format: "PDF (A4)",
        pages: 3,
      },
      {
        id: 4,
        code: "GUI-REC-004",
        name: "Guia de Recolhimento – Encerramento Marco Anterior",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 2,
      },

      // 2) Gestão de Projetos de TI e Engenharia de Software
      {
        id: 5,
        code: "CTD-PRJ-005",
        name: "Catálogo de Tipos Documentais – Projeto Alpha",
        revision: "Rev. 2",
        format: "PDF (A4)",
        pages: 18,
      },
      {
        id: 6,
        code: "PLN-PRJ-006",
        name: "Plano de Projeto – Cronograma Executivo",
        revision: "Rev. 3",
        format: "PDF (A4)",
        pages: 12,
      },
      {
        id: 7,
        code: "MAR-CTT-007",
        name: "Registro de Marco Contratual – Entrega Parcial",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 5,
      },

      // 3) Desenvolvimento e Manutenção de Sistemas
      {
        id: 8,
        code: "SRS-SIS-008",
        name: "Documento de Requisitos (SRS) – Sistema de Supervisão",
        revision: "Rev. 1",
        format: "PDF (A4)",
        pages: 36,
      },
      {
        id: 9,
        code: "STD-SIS-009",
        name: "Documento de Testes (STD) – Cenários Integrados",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 22,
      },

      // 4) Documentação Técnica e Científica Final
      {
        id: 10,
        code: "REL-TEC-010",
        name: "Relatório Técnico Parcial – Ensaios Funcionais",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 27,
      },

      // 5) Administração / Infra + Cadastro Institucional
      {
        id: 11,
        code: "CTR-PRJ-011",
        name: "Contrato de Projeto – Adendo Técnico 01",
        revision: "Rev. 1",
        format: "PDF (A4)",
        pages: 14,
      },
      {
        id: 12,
        code: "CAD-CLI-012",
        name: "Cadastro de Cliente – Empresa ABC Energia",
        revision: "Rev. 0",
        format: "PDF (A4)",
        pages: 6,
      },

      // 7) Preservação Digital e Recolhimento Arquivístico
      {
        id: 13,
        code: "OAIS-AIP-013",
        name: "Pacote OAIS (AIP) – Conjunto de Documentos do Marco 2",
        revision: "Rev. 0",
        format: "ZIP / AIP",
        pages: 0, // pacote lógico
      },
      {
        id: 14,
        code: "LOG-PRES-014",
        name: "Log de Preservação Digital – Operações de Ingestão",
        revision: "Rev. 0",
        format: "TXT / JSON",
        pages: 0,
      },
    ],
    observations:
      "Conjunto contempla tipos documentais de protocolo, projeto, desenvolvimento de sistemas, documentação técnica, contratos, cadastros e preservação digital, conforme Tabela de Temporalidade do DOCScriptum.",
    status: "Emitida",
    emittedBy: "Sistema DOCScriptum",
    emissionDate: "20/05/2025 11:27",
  }

  const totalPages = grd.documents.reduce((sum, doc) => sum + (doc.pages || 0), 0)

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader
            title={`GRD ${grd.number}`}
            description="Guia de Remessa de Documentação alinhada à Tabela de Temporalidade e aos tipos documentais do projeto."
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end w-full">
              <Link to="/grds">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </PageHeader>

          <div className="space-y-6">
            {/* CABEÇALHO DA GRD */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl neon-text">
                  GUIA DE REMESSA DE DOCUMENTAÇÃO
                </CardTitle>
                <div className="flex justify-center gap-4 mt-4">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {grd.number}
                  </Badge>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {grd.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Emissão</p>
                    <p className="font-bold flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {grd.date}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Protocolo</p>
                    <p className="font-bold">{grd.protocol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projeto</p>
                    <p className="font-bold">{grd.project}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ORIGEM E DESTINO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    REMETENTE
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-bold text-lg">{grd.origin.name}</p>
                    <Badge variant="outline">{grd.origin.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <strong>Contato:</strong> {grd.origin.contact}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {grd.origin.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Telefone: {grd.origin.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>Endereço:</strong>
                      <br />
                      {grd.origin.address}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    DESTINATÁRIO
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-bold text-lg">{grd.destination.name}</p>
                    <Badge variant="outline">{grd.destination.type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <strong>Contato:</strong> {grd.destination.contact}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Email: {grd.destination.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Telefone: {grd.destination.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>Endereço:</strong>
                      <br />
                      {grd.destination.address}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* DETALHES DA REMESSA */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>DETALHES DA REMESSA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Propósito</p>
                    <p className="font-medium">{grd.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Envio</p>
                    <p className="font-medium">{grd.deliveryMethod}</p>
                  </div>
                </div>
                {grd.observations && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{grd.observations}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DOCUMENTOS TRAMITADOS */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  DOCUMENTOS TRAMITADOS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {grd.documents.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border border-border/60 bg-card/60 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-bold">
                          {String(index + 1).padStart(2, "0")}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {doc.code} - {doc.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {doc.revision} • Formato: {doc.format} •{" "}
                            {doc.pages > 0
                              ? `${doc.pages} página${doc.pages > 1 ? "s" : ""}`
                              : "conteúdo digital não paginado"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Incluído</Badge>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm">
                  <span>
                    <strong>Total de documentos:</strong> {grd.documents.length}
                  </span>
                  <span>
                    <strong>Total de páginas:</strong> {totalPages}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* ASSINATURA */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle>ASSINATURA DO REMETENTE</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">RESPONSÁVEL PELA REMESSA</p>
                    <div className="border-b border-muted-foreground mt-8 mb-2" />
                    <p className="text-sm text-muted-foreground">Assinatura e data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RODAPÉ */}
            <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
              <CardContent className="pt-6">
                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <p>Emitido por: {grd.emittedBy}</p>
                  <p>Data/Hora de Emissão: {grd.emissionDate}</p>
                  <p className="font-medium">
                    DOCScriptum — Sistema de Governança Documental
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
