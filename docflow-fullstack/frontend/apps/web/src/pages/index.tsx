import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  BarChart3,
  FileText,
  FolderKanban,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AppHeader from "@/components/AppHeader"

type Slide = {
  id: number
  category: string
  title: string
  area: string
  description: string
  date: string
  link: string
}

const SLIDES: Slide[] = [
  {
    id: 1,
    category: "PAINEL INICIAL · ATUALIZAÇÕES & BOLETIM ARQUIVÍSTICO-TECNOLÓGICO",
    title: "Autenticação JWT com roles e controle granular por perfil",
    area: "Segurança da Informação & LGPD",
    description:
      "Camada de segurança preparada para LGPD, com autorização por papéis, registros de acesso e segregação de funções.",
    date: "03 / 05",
    link: "https://jwt.io/introduction",
  },
  {
    id: 2,
    category: "NORMAS & BOAS PRÁTICAS",
    title: "Tabelas de temporalidade focadas em projetos e serviços de TI",
    area: "Gestão de Documentos & Protocolo",
    description:
      "Classificação e prazos de guarda alinhados a projetos de software, serviços de TI e documentação técnico-científica.",
    date: "02 / 05",
    link: "https://www.conarq.gov.br",
  },
  {
    id: 3,
    category: "PRESERVAÇÃO DIGITAL & RDC-ARQ",
    title: "Preparação para pacotes OAIS e repositórios confiáveis",
    area: "Preservação Digital & Recolhimento Arquivístico",
    description:
      "Metadados, logs de cadeia de custódia e exportação estruturada pensando em RDC-Arq e repositórios de preservação.",
    date: "01 / 05",
    link: "https://rnp.gov.br/servicos/preservacao-digital",
  },
  {
    id: 4,
    category: "ENGENHARIA DE SOFTWARE & FRAMEWORKS",
    title: "Pipeline de documentação integrado ao ciclo de vida do projeto",
    area: "Engenharia de Software & DevOps",
    description:
      "Integração entre backlog, versões de documento, mudanças de requisitos e entregas em projetos de engenharia.",
    date: "04 / 05",
    link: "https://martinfowler.com/articles/continuousIntegration.html",
  },
  {
    id: 5,
    category: "GOVERNANÇA DE DADOS & COMPLIANCE",
    title: "Matriz de responsabilidades e rastreabilidade de decisões",
    area: "Governança de Dados & Compliance",
    description:
      "Indicadores de uso, trilhas de auditoria e visão 360º sobre quem acessa, altera e valida os documentos críticos.",
    date: "05 / 05",
    link: "https://damap.org.br/",
  },
]

type UpdateItem = {
  id: number
  type: "document" | "request" | "event" | "project"
  title: string
  description: string
  module: string
  date: string
}

const UPDATES: UpdateItem[] = [
  {
    id: 1,
    type: "document",
    title: "Novo documento cadastrado",
    description: "Relatório técnico “RDC-Arq – Plano de preservação” vinculado ao Projeto EMARD.",
    module: "Documentação & Protocolo",
    date: "12/11/25 · 09:42",
  },
  {
    id: 2,
    type: "request",
    title: "Nova solicitação para cliente",
    description: "Abertura de solicitação de atualização de escopo para o cliente TOTVS Services.",
    module: "Mensageria & Solicitações",
    date: "11/11/25 · 16:05",
  },
  {
    id: 3,
    type: "event",
    title: "Novo evento S-1200 processado",
    description: "Evento de remuneração enviado e validado para o projeto de folha integrada.",
    module: "Governança de Dados & eSocial",
    date: "10/11/25 · 21:18",
  },
  {
    id: 4,
    type: "project",
    title: "Novo projeto cadastrado",
    description: "Projeto “DocScriptum – Fase de Integração com RDC-Arq” criado no módulo de projetos.",
    module: "Gestão de Projetos & Serviços de TI",
    date: "09/11/25 · 14:27",
  },
]

// Home (mantendo o nome para não quebrar rotas existentes)
export default function ProjectsPage() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const activeSlide = SLIDES[currentSlide]

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
  }

  const renderUpdateIcon = (type: UpdateItem["type"]) => {
    const iconClass = "h-4 w-4 text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300"

    switch (type) {
      case "document":
        return <FileText className={iconClass} />
      case "request":
        return <ArrowRightLeft className={iconClass} />
      case "event":
        return <BarChart3 className={iconClass} />
      case "project":
      default:
        return <FolderKanban className={iconClass} />
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {/* sem bg sólido aqui para o vídeo aparecer por trás no modo claro também */}
      <main className="flex-1">
        {/* Hero / boletim */}
        <section className="w-full py-4 md:py-6 lg:py-8">
          <div className="container px-4 md:px-6 flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Card principal / boletim */}
            <Card
              className="
                relative neon-border flex flex-col justify-between overflow-hidden
                border border-border/70
                bg-background/70 dark:bg-background/40
                backdrop-blur-md
                flex-1 min-w-0
                h-[420px]
              "
            >
              <CardContent className="pt-5 pb-10 md:pt-6 md:pb-12 flex flex-col justify-between h-full">
                <div>
                  <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    {activeSlide.category}
                  </p>

                  {/* Título em verde escuro no modo claro, como os ícones */}
                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300">
                    {activeSlide.title}
                  </h1>

                  <p className="mt-2 text-sm font-medium text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300">
                    {activeSlide.area}
                  </p>

                  <p className="mt-4 max-w-3xl text-sm md:text-base text-muted-foreground">
                    {activeSlide.description}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{activeSlide.date}</span>

                  <a
                    href={activeSlide.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300 hover:underline"
                  >
                    Ver material técnico
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>

              {/* Controles do slider */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full border border-border/60 bg-background/80 backdrop-blur"
                    onClick={handlePrev}
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full border border-border/60 bg-background/80 backdrop-blur"
                    onClick={handleNext}
                    aria-label="Próximo slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {SLIDES.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentSlide
                          ? "w-6 bg-[hsla(182,80%,25%,0.945)] dark:bg-cyan-300"
                          : "w-3 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                      }`}
                      aria-label={`Ir para slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </Card>

            {/* Painel retrátil de Últimas atualizações */}
            <div
              className="
                group relative
                transition-all duration-300
                w-full
                lg:w-[40px] lg:hover:w-[420px]
                bg-background/60 dark:bg-background/40
                backdrop-blur-md neon-border
                border border-border/70
                rounded-xl
                overflow-hidden
                h-[420px]
                flex flex-col
              "
            >
              {/* Header mobile (sempre visível em < lg) */}
              <div className="px-4 py-4 lg:hidden">
                <h2 className="text-base font-semibold">Últimas atualizações</h2>
              </div>

              {/* Lista mobile (sem retrátil) */}
              <div className="px-3 pb-4 space-y-2.5 max-h-[360px] overflow-y-auto pr-3 lg:hidden">
                {UPDATES.map((update) => (
                  <div
                    key={update.id}
                    className="
                      flex items-start gap-3 rounded-lg
                      border border-border/60
                      bg-background/50 dark:bg-background/30
                      px-3 py-2.5
                    "
                  >
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[hsla(182,80%,25%,0.12)] dark:bg-cyan-300/10">
                      {renderUpdateIcon(update.type)}
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-medium leading-snug">
                        {update.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                        {update.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {update.date} ·{" "}
                        <span className="font-medium text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300">
                          {update.module}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full justify-center text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/mensageria")}
                >
                  Ver todos os registros de atualização
                </Button>
              </div>

              {/* Header desktop (só aparece quando expandido) */}
              <div className="hidden lg:group-hover:block px-4 py-4">
                <h2 className="text-base font-semibold">Últimas atualizações</h2>
              </div>

              {/* Lista desktop – só quando expandido, com rolagem vertical */}
              <div
                className="
                  hidden
                  lg:group-hover:block
                  px-3 pb-4 space-y-2.5
                  max-h-[360px]
                  overflow-y-auto
                  pr-3
                  scrollbar-thin scrollbar-thumb-muted-foreground/30 
                  scrollbar-track-transparent
                "
              >
                {UPDATES.map((update) => (
                  <div
                    key={update.id}
                    className="
                      flex items-start gap-3 rounded-lg
                      border border-border/60
                      bg-background/50 dark:bg-background/30
                      px-3 py-2.5
                    "
                  >
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[hsla(182,80%,25%,0.12)] dark:bg-cyan-300/10">
                      {renderUpdateIcon(update.type)}
                    </div>

                    <div className="flex-1">
                      <p className="text-xs font-medium leading-snug">
                        {update.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                        {update.description}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {update.date} ·{" "}
                        <span className="font-medium text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300">
                          {update.module}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 w-full justify-center text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/mensageria")}
                >
                  Ver todos os registros de atualização
                </Button>
              </div>

              {/* Quando fechado no desktop: só a “abinha” com ícones, sem nada cortado */}
              <div className="absolute inset-y-0 right-0 hidden lg:flex flex-col items-center justify-center gap-3 pr-2 group-hover:hidden">
                {UPDATES.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsla(182,80%,25%,0.18)] dark:bg-cyan-300/15"
                  >
                    {renderUpdateIcon(u.type)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Visão geral de módulos */}
        <section className="w-full pb-10 md:pb-14">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="neon-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gestão de Projetos & Serviços de TI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Projetos, sprints, serviços recorrentes e contratos de suporte.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300"
                    asChild
                  >
                    <Link to="/projects">Ir para Projetos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="neon-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recursos & Parceiros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Cadastro de clientes, fornecedores, equipes internas e stakeholders.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300"
                    asChild
                  >
                    <Link to="/resources">Ir para Recursos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="neon-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Documentação & Protocolo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Listas de documentos, GRDs, tramitações e histórico arquivístico.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300"
                    asChild
                  >
                    <Link to="/grds">Ver Protocolos</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="neon-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Mensageria & Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Alertas de prazos, mudanças de status e registros de comunicação.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-[hsla(182,80%,25%,0.945)] dark:text-cyan-300"
                    asChild
                  >
                    <Link to="/mensageria">Abrir Mensageria</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-10 md:flex-row">
          <p className="text-center text-xs leading-loose text-muted-foreground md:text-left">
            © 2025 DocScriptum. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
