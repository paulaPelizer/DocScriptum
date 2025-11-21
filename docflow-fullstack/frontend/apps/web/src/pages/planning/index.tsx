import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"

export default function PlanningPage() {
  const [selectedProject, setSelectedProject] = useState("projeto-alpha")

  const projects = [
    { id: "projeto-alpha", name: "Projeto Alpha – Subestação 230kV" },
    { id: "expansao-sede", name: "Expansão Sede – Prédio Administrativo" },
    { id: "reforma-unidade-3", name: "Reforma Unidade 3 – Adequação Elétrica" },
    { id: "projeto-beta", name: "Projeto Beta – Linha de Transmissão" },
  ]

  const milestones = [
    {
      id: 1,
      name: "Entrega Inicial (Projeto Básico)",
      dueDate: "15/04/2025",
      status: "Concluído",
      progress: 100,
      documentsTotal: 6,
      documentsDelivered: 6,
      daysUntilDue: -5,
    },
    {
      id: 2,
      name: "Projetos Complementares",
      dueDate: "30/05/2025",
      status: "Em andamento",
      progress: 75,
      documentsTotal: 8,
      documentsDelivered: 6,
      daysUntilDue: 15,
    },
    {
      id: 3,
      name: "Documentação Executiva",
      dueDate: "15/07/2025",
      status: "Atrasado",
      progress: 25,
      documentsTotal: 6,
      documentsDelivered: 1,
      daysUntilDue: -3,
    },
    {
      id: 4,
      name: "Entrega Final (As Built / Dossiê Técnico)",
      dueDate: "30/09/2025",
      status: "Pendente",
      progress: 0,
      documentsTotal: 4,
      documentsDelivered: 0,
      daysUntilDue: 120,
    },
  ]

  const documents = [
    {
      id: 1,
      code: "ARQ-PL-001",
      name: "Planta Baixa - Térreo",
      milestone: "Entrega Inicial (Projeto Básico)",
      dueDate: "15/04/2025",
      deliveredDate: "12/04/2025",
      status: "Entregue",
      daysDelay: 0,
      temporalPhase: "Corrente",
      retentionRule: "Vigência do contrato + 5 anos",
    },
    {
      id: 2,
      code: "ARQ-MD-002",
      name: "Memorial Descritivo de Arquitetura",
      milestone: "Entrega Inicial (Projeto Básico)",
      dueDate: "15/04/2025",
      deliveredDate: "18/04/2025",
      status: "Entregue",
      daysDelay: 3,
      temporalPhase: "Corrente",
      retentionRule: "Enquanto em uso + 5 anos",
    },
    {
      id: 3,
      code: "EST-EQ-003",
      name: "Projeto Estrutural – Bloco A",
      milestone: "Projetos Complementares",
      dueDate: "30/05/2025",
      deliveredDate: null,
      status: "Em elaboração",
      daysDelay: 0,
      temporalPhase: "Corrente",
      retentionRule: "Até encerramento da obra + 10 anos",
    },
    {
      id: 4,
      code: "PLN-CR-004",
      name: "Cronograma Executivo consolidado",
      milestone: "Documentação Executiva",
      dueDate: "15/07/2025",
      deliveredDate: null,
      status: "Atrasado",
      daysDelay: 3,
      temporalPhase: "Intermediária",
      retentionRule: "Após encerramento: transferir p/ intermediária (5 anos)",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído":
      case "Entregue":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "Em andamento":
      case "Em elaboração":
        return <Clock className="h-4 w-4 text-sky-500" />
      case "Atrasado":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Concluído":
      case "Entregue":
        return "default"
      case "Em andamento":
      case "Em elaboração":
        return "secondary"
      case "Atrasado":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDelayTrend = (daysDelay: number) => {
    if (daysDelay > 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />
    } else if (daysDelay < 0) {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />
    }
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader
            title="Planejamento"
            description="Cronograma de marcos contratuais, ciclo de vida documental e aderência à tabela de temporalidade"
          >
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar marco ou documento..." className="pl-8" />
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full sm:w-[260px]">
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PageHeader>

          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList className="w-full justify-start rounded-xl bg-muted/60 p-1 shadow-inner overflow-x-auto">
              <TabsTrigger value="timeline" className="flex-1">
                Cronograma
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">
                Análise de Performance
              </TabsTrigger>
            </TabsList>

            {/* ===================== ABA CRONOGRAMA ===================== */}
            <TabsContent value="timeline" className="space-y-6">
              {/* Resumo do Projeto / Ciclo de Vida */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="neon-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Marcos</CardTitle>
                    <Calendar className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4</div>
                    <p className="text-xs text-muted-foreground">
                      1 concluído • 2 em andamento • 1 pendente
                    </p>
                  </CardContent>
                </Card>

                <Card className="neon-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Documentos no Escopo</CardTitle>
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">13 / 24</div>
                    <p className="text-xs text-muted-foreground">
                      54% entregues dentro da janela contratual
                    </p>
                  </CardContent>
                </Card>

                <Card className="neon-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Próximo Marco</CardTitle>
                    <Clock className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">15 dias</div>
                    <p className="text-xs text-muted-foreground">Projetos Complementares</p>
                  </CardContent>
                </Card>

                <Card className="neon-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risco de Atraso</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1 marco</div>
                    <p className="text-xs text-muted-foreground">
                      Documentação Executiva em alerta
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cronograma de Marcos */}
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Marcos Contratuais</CardTitle>
                  <CardDescription>
                    Linha do tempo de entregas, progresso por pacote de documentos e situação atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="border border-border/70 bg-card/60 rounded-xl p-4"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(milestone.status)}
                            <h3 className="font-medium">{milestone.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(milestone.status)}>
                              {milestone.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Prazo: {milestone.dueDate}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso de documentos</span>
                            <span>
                              {milestone.documentsDelivered}/{milestone.documentsTotal}{" "}
                              documentos
                            </span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>

                        <div className="flex justify-between items-center mt-3 text-xs md:text-sm text-muted-foreground">
                          <span>{milestone.progress}% do pacote concluído</span>
                          <span>
                            {milestone.daysUntilDue > 0
                              ? `${milestone.daysUntilDue} dias restantes`
                              : milestone.daysUntilDue < 0
                              ? `${Math.abs(milestone.daysUntilDue)} dias de atraso`
                              : "Vence hoje"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Documentos por Marco / Ciclo de Vida */}
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Documentos por Marco</CardTitle>
                  <CardDescription>
                    Situação de entrega, fase do ciclo de vida e regra da tabela de temporalidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-border/70 bg-card/60 rounded-xl p-3"
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(doc.status)}
                          <div>
                            <p className="font-medium">
                              {doc.code} — {doc.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Marco: {doc.milestone}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Fase:{" "}
                              <span className="font-medium">{doc.temporalPhase}</span> • Regra:{" "}
                              {doc.retentionRule}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 text-sm">
                          <div className="text-right">
                            <p className="font-medium">Prazo: {doc.dueDate}</p>
                            {doc.deliveredDate && (
                              <p className="text-muted-foreground">
                                Entregue: {doc.deliveredDate}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusColor(doc.status)}>{doc.status}</Badge>
                            {doc.daysDelay !== 0 && getDelayTrend(doc.daysDelay)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===================== ABA ANÁLISE ===================== */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Métricas de Performance / Temporalidade */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="neon-border">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Cumprimento da Tabela de Temporalidade
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Documentos entregues dentro da janela prevista
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-500">82%</div>
                    <p className="text-sm text-muted-foreground">
                      9 de 11 documentos com prazo aderente à regra de guarda
                    </p>
                  </CardContent>
                </Card>

                <Card className="neon-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Atraso Médio</CardTitle>
                    <CardDescription className="text-xs">
                      Considerando apenas documentos atrasados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">2,3 dias</div>
                    <p className="text-sm text-muted-foreground">
                      Tendência estável na última quinzena
                    </p>
                  </CardContent>
                </Card>

                <Card className="neon-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Marcos em Risco</CardTitle>
                    <CardDescription className="text-xs">
                      A partir de atraso projetado x % de progresso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-500">1</div>
                    <p className="text-sm text-muted-foreground">
                      Documentação Executiva requer monitoramento próximo
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* “Pseudo-gráfico” de Entregas por Marco */}
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Análise de Entregas por Marco</CardTitle>
                  <CardDescription>
                    Comparativo visual entre documentos previstos, entregues e pendentes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{milestone.name}</h4>
                          <span className="text-sm text-muted-foreground">
                            Prazo: {milestone.dueDate}
                          </span>
                        </div>
                        <div className="grid grid-cols-10 gap-1 h-8">
                          {Array.from({ length: milestone.documentsTotal }, (_, i) => (
                            <div
                              key={i}
                              className={`rounded ${
                                i < milestone.documentsDelivered
                                  ? "bg-emerald-500"
                                  : milestone.status === "Atrasado"
                                  ? "bg-red-400"
                                  : "bg-muted"
                              }`}
                              title={
                                i < milestone.documentsDelivered
                                  ? "Documento entregue"
                                  : milestone.status === "Atrasado"
                                  ? "Documento em atraso"
                                  : "Documento pendente"
                              }
                            />
                          ))}
                          {Array.from({ length: Math.max(0, 10 - milestone.documentsTotal) }, (_, i) => (
                            <div key={`empty-${i}`} className="rounded bg-muted/60" />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {milestone.documentsDelivered} entregues de {milestone.documentsTotal}
                          </span>
                          <span>{milestone.progress}% concluído</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Leitura de Risco (sem ação, só insight) */}
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Leitura de Risco do Cronograma</CardTitle>
                  <CardDescription>
                    Interpretação dos marcos com base em atraso, carga documental e temporalidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-red-500 pl-4 py-2 bg-destructive/5 rounded-md">
                      <h4 className="font-medium text-red-700">Alto Risco</h4>
                      <p className="text-sm text-muted-foreground">
                        Marco <strong>&quot;Documentação Executiva&quot;</strong> com 3 dias de
                        atraso, apenas 25% de progresso e documentos-chave ainda na fase
                        corrente sem consolidação para guarda intermediária.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Observação: tendência de impacto em prazos contratuais e na migração
                        adequada para as fases definidas na tabela de temporalidade.
                      </p>
                    </div>

                    <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 rounded-md">
                      <h4 className="font-medium text-amber-700">Médio Risco</h4>
                      <p className="text-sm text-muted-foreground">
                        Marco <strong>&quot;Projetos Complementares&quot;</strong> com 15 dias
                        restantes e 75% de progresso. Volume de documentos ainda em elaboração,
                        mas dentro da janela aceitável.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Observação: recomenda-se acompanhar marcos dependentes que concentram
                        muitos documentos técnicos.
                      </p>
                    </div>

                    <div className="border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50 rounded-md">
                      <h4 className="font-medium text-emerald-700">Baixo Risco</h4>
                      <p className="text-sm text-muted-foreground">
                        Marco <strong>&quot;Entrega Final&quot;</strong> com 120 dias restantes,
                        janela confortável para consolidação de dossiê técnico e preparação para
                        guarda permanente dos conjuntos definidos como de valor arquivístico.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Observação: cenário adequado para planejar atividades de avaliação
                        documental e atualização da tabela de temporalidade.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
