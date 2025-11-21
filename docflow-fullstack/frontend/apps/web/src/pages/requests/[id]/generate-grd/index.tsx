// src/pages/requests/[id]/generate-grd/index.tsx
import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft, FileText, Printer, Download, CheckCircle,
  AlertTriangle, Info, Send
} from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { apiGet, apiPut, apiPost } from "@/services/api"

/* ===== Tipos alinhados ao backend ===== */
type ApiOrganization = { id: number; name: string | null }
type ApiProject = { id: number; code?: string | null; name?: string | null }
type ApiDocument = { id: number; code?: string | null; title?: string | null; revision?: string | null }

// status local, incluindo Aguardando Cliente e Aguardando ADM
type ApiStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "WAITING_CLIENT"
  | "WAITING_ADM"

type ApiRequest = {
  id: number
  requestNumber: string
  project?: ApiProject | null
  origin?: ApiOrganization | null
  destination?: ApiOrganization | null
  purpose?: string | null
  documents?: ApiDocument[]
  requesterName?: string | null
  requesterContact?: string | null
  status?: ApiStatus
}

/* ===== Utils ===== */
const formatDateBR = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d)

/* ===== Helpers de mock/calculo ===== */
// inteiro pseudo-aleatório estável
function seeded(id: number, mod: number, bias = 0) {
  let x = (id * 1103515245 + 12345) & 0x7fffffff
  return (x % mod) + bias
}
function parseRev(rev?: string | null): number | null {
  if (!rev) return null
  const n = rev.replace(/rev\.?/i, "").trim()
  const v = parseInt(n, 10)
  return Number.isFinite(v) ? v : null
}
function enrichDoc(d: ApiDocument) {
  const id = Number(d.id)
  const repoRev = seeded(id, 5, 1)           // 1..5
  const ok = seeded(id, 10) < 6              // 60% ok
  const uploadRev = ok ? repoRev + 1 : Math.max(1, repoRev + (seeded(id + 7, 3) - 1))
  const pages = seeded(id + 3, 40, 1)        // 1..40
  const quality = 70 + (seeded(id + 5, 31) % 31) // 70..100
  const format = ["A4", "A3", "A2", "A1"][seeded(id + 9, 4)]
  const currentRepoRev = parseRev(d.revision) ?? repoRev
  const uploadedRev = uploadRev
  const isSequential = uploadedRev === currentRepoRev + 1

  return {
    id,
    code: d.code ?? `DOC-${id}`,
    name: d.title ?? "Documento",
    currentRepoRev,
    uploadedRev,
    isSequential,
    pages,
    quality,
    format,
  }
}

/* Indicadores de qualidade */
function quartile(pct: number) {
  if (pct < 25) return "Q1"
  if (pct < 50) return "Q2"
  if (pct < 75) return "Q3"
  return "Q4"
}
function QualityIndicator({ q }: { q: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(q)))
  return (
    <div className="flex items-center gap-2 min-w-[120px]" title={`Qualidade ${pct}%`}>
      <div className="h-2 w-24 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}
function QualityGlyph({ q }: { q: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(q)))
  const qtl = quartile(pct)
  const color = qtl === "Q1" ? "#ef4444" : qtl === "Q2" ? "#f59e0b" : qtl === "Q3" ? "#06b6d4" : "#22c55e"
  const path =
    qtl === "Q1" ? "M1,2 L10,8 L18,10 L26,11" :
    qtl === "Q2" ? "M1,6 C6,8 12,9 18,7 C22,6 24,5 26,6" :
    qtl === "Q3" ? "M1,7 C6,5 12,4 18,6 C22,7 24,8 26,7" :
    "M1,11 L10,9 L18,6 L26,2"
  const arrow =
    qtl === "Q1" ? "M26,11 l-3,-1.5 l0,3 z" :
    qtl === "Q4" ? "M26,2 l-3,1.5 l0,-3 z" :
    null
  return (
    <div className="flex items-center gap-2 min-w-[120px]" title={`Qualidade ${pct}%`}>
      <svg width="28" height="12" viewBox="0 0 28 12" role="img" aria-label={`Qualidade ${pct}%`}>
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        {arrow && <path d={arrow} fill={color} />}
      </svg>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function GenerateGRDPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [isGenerating, setIsGenerating] = useState(false)
  const [grdGenerated, setGrdGenerated] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [req, setReq] = useState<ApiRequest | null>(null)

  // Mensagem de pendências ao solicitante
  const [pendingMessage, setPendingMessage] = useState("")
  const [messageSent, setMessageSent] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  // “Cabeçalho” da GRD (local)
  const grdData = {
    number: "DOCM-AUTO-" + (id ?? "0000"),
    date: formatDateBR(new Date()),
    protocol: "PROT-" + (100000 + Number(id ?? 0)),
  }

  // Carrega solicitação
  useEffect(() => {
    let abort = false
    ;(async () => {
      if (!id) { setError("ID inválido"); setLoading(false); return }
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet<ApiRequest>(`/api/v1/requests/${id}`)
        if (!abort) setReq(data)
      } catch (e) {
        console.error(e)
        if (!abort) setError("Não foi possível carregar a solicitação.")
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [id])

  // Documentos enriquecidos com checagens (mock)
  const docs = useMemo(() => (req?.documents ?? []).map(enrichDoc), [req])
  const nonSequential = docs.filter(d => !d.isSequential)
  const hasRequesterPendencies = nonSequential.length > 0
  const canGenerate = !hasRequesterPendencies && req?.status === "WAITING_ADM"

  // Preenche mensagem padrão de pendências
  useEffect(() => {
    const nome = (req?.requesterName && req.requesterName.trim()) ? req.requesterName.trim() : "solicitante"
    const numero = req?.requestNumber ?? (id ? `#${id}` : "N/D")
    const linhas = nonSequential.map(d =>
      `• ${d.code} — ${d.name}: Revisão enviada ${d.uploadedRev} não é sequencial à última do repositório (${d.currentRepoRev}).`
    )
    const texto =
`Prezado ${nome}, Identificamos inconsistências no sequencial de revisão/versão do seu documento.
${linhas.join("\n")}

Para finalizar a tramitação de número ${numero}, será necessário substituir o documento no repositório por um novo com a revisão correta.`
    setPendingMessage(texto)
  }, [nonSequential, req?.requesterName, req?.requestNumber, id])

  const handleSendMessage = async () => {
    if (!id || !req) return

    if (!pendingMessage.trim()) {
      setSendError("Escreva uma mensagem antes de enviar.")
      return
    }

    if (!req.requesterContact || !req.requesterContact.trim()) {
      setSendError("Solicitação não possui e-mail de contato do solicitante (requester_contact).")
      return
    }

    setIsSendingMessage(true)
    setSendError(null)
    setMessageSent(false)

    // 1) Primeiro tenta enviar o e-mail
    try {
      await apiPost(`/api/v1/requests/${id}/notify-requester`, {
        message: pendingMessage,
      })
      setMessageSent(true)
    } catch (e) {
      console.error(e)
      setSendError("Não foi possível enviar a mensagem ao solicitante.")
      setIsSendingMessage(false)
      return
    }

    // 2) Depois tenta atualizar o status para WAITING_CLIENT
    try {
      await apiPut(`/api/v1/requests/${id}/status`, { status: "WAITING_CLIENT" })
      const updated = await apiGet<ApiRequest>(`/api/v1/requests/${id}`)
      setReq(updated)
    } catch (e) {
      console.error(e)
      setSendError(
        "Mensagem enviada com sucesso, mas não foi possível atualizar o status para 'Aguardando cliente'. " +
        "Verifique se o enum RequestStatus no backend já contém o valor WAITING_CLIENT."
      )
    } finally {
      setIsSendingMessage(false)
    }
  }

  // >>> GERAÇÃO SOMENTE NO CLIQUE <<<
  const handleGenerateGRD = async () => {
    if (!id) return
    try {
      setIsGenerating(true)
      await apiPut(`/api/v1/requests/${id}/status`, { status: "COMPLETED" })
      const refreshed = await apiGet<ApiRequest>(`/api/v1/requests/${id}`)
      setReq(refreshed)
      setGrdGenerated(true)
    } catch (e) {
      console.error(e)
      alert("Falha ao gerar a GRD. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFinalize = () => {
    navigate("/requests")
  }

  // Tela de sucesso (após clique)
  if (grdGenerated) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">
          <div className="container mx-auto max-w-4xl">
            <PageHeader
              title="GRD Gerada com Sucesso"
              description={`Solicitação ${req?.requestNumber ?? (id ? `#${id}` : "")}`}
            >
              <Link to="/requests">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Solicitações
                </Button>
              </Link>
            </PageHeader>

            <div className="space-y-6">
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <CardTitle className="text-green-500">GRD Gerada com Sucesso!</CardTitle>
                  </div>
                  <CardDescription>
                    Solicitação {req?.requestNumber} — {grdData.number}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Número da GRD</Label>
                      <p className="font-bold text-lg">{grdData.number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data de Geração</Label>
                      <p className="font-medium">{grdData.date}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Protocolo</Label>
                      <p className="font-medium">{grdData.protocol}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-4">
                    <Link to={`/documents/routing/${id}/grd`}>
                      <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Visualizar GRD
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
                </CardContent>
              </Card>

              {nonSequential.length > 0 && (
                <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Pendências detectadas (informativo)</CardTitle>
                    <CardDescription>Alguns documentos não estavam sequenciais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {nonSequential.map((d) => (
                      <div key={d.id} className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        {d.code} — {d.name}: Upload Rev. {d.uploadedRev} / Repo Rev. {d.currentRepoRev}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center">
                <Button onClick={handleFinalize}>
                  Finalizar e Voltar para Solicitações
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Tela de preparo (antes do clique)
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader
            title="Gerar GRD"
            description="Gere a Guia de Remessa de Documentação para a solicitação aprovada"
          >
            <Link to={`/requests/${id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {!loading && !error && req && (
            <div className="space-y-6">
              {/* Dados da solicitação */}
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Dados da Solicitação</CardTitle>
                  <CardDescription>Informações da solicitação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Número da Solicitação</Label>
                      <p className="font-medium">{req.requestNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Projeto</Label>
                      <p className="font-medium">
                        {(req.project?.code ? `${req.project.code} — ` : "") + (req.project?.name ?? "—")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Origem</Label>
                      <p className="font-medium">{req.origin?.name ?? "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Destino</Label>
                      <p className="font-medium">{req.destination?.name ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados da GRD */}
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Dados do Protocolo</CardTitle>
                  <CardDescription>Informações que serão incluídas na Guia de Remessa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grd-number">Número do Documento</Label>
                      <Input id="grd-number" value={grdData.number} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grd-date">Data de Emissão</Label>
                      <Input id="grd-date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protocol">Protocolo do Sistema</Label>
                      <Input id="protocol" value={grdData.protocol.toString()} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery-method">Método de Entrega</Label>
                      <Input id="delivery-method" placeholder="Ex: Correios, Entrega Pessoal" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea id="observations" placeholder="Observações adicionais para o Protocolo..." className="min-h-[80px]" />
                  </div>
                </CardContent>
              </Card>

              {/* Documentos Incluídos */}
              <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle>Documentos Incluídos</CardTitle>
                  <CardDescription>
                    Validação de revisão/versão, formato, número de páginas e qualidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {docs.map((doc, idx) => (
                      <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{idx + 1}</Badge>
                          <div>
                            <p className="font-medium">
                              {doc.code} — {doc.name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>Repo: Rev. {doc.currentRepoRev}</span>
                              <span>•</span>
                              <span>Upload: Rev. {doc.uploadedRev}</span>
                              {!doc.isSequential ? (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Revisão não sequencial
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  OK
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Info className="h-3.5 w-3.5" />
                              Formato: {doc.format} • {doc.pages} pág.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block">
                            <QualityGlyph q={doc.quality} />
                          </div>
                          <div className="sm:hidden">
                            <QualityIndicator q={doc.quality} />
                          </div>
                          <Badge variant={doc.isSequential ? "secondary" : "destructive"}>
                            {doc.isSequential ? "Incluído" : "Pendência"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />
                  <div className="text-sm text-muted-foreground">
                    <strong>Total de documentos:</strong> {docs.length}
                  </div>
                </CardContent>
              </Card>

              {/* Pendências do Solicitante */}
              {nonSequential.length > 0 && (
                <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Pendências do Solicitante</CardTitle>
                    <CardDescription>Conferir Revisão/Versão do documento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Existem documentos com revisão não sequencial. Enquanto a pendência não for atendida, mantenha a solicitação “IN_PROGRESS”.
                    </div>
                    <Textarea
                      value={pendingMessage}
                      onChange={(e) => setPendingMessage(e.target.value)}
                      className="min-h-[140px]"
                      placeholder="Escreva sua mensagem ao solicitante…"
                    />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleSendMessage}
                          variant="default"
                          disabled={isSendingMessage}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {isSendingMessage ? "Enviando..." : "Enviar mensagem ao solicitante"}
                        </Button>
                        {messageSent && (
                          <span className="text-sm text-emerald-500">
                            Mensagem enviada ao solicitante ({req.requesterContact}).
                          </span>
                        )}
                      </div>
                      {sendError && (
                        <span className="text-sm text-red-500">{sendError}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-4">
                <Link to={`/requests/${id}`}>
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button
                  onClick={handleGenerateGRD}
                  disabled={!canGenerate || isGenerating}
                  aria-disabled={!canGenerate || isGenerating}
                  title={!canGenerate ? "Resolva as pendências para habilitar a geração do Protocolo" : undefined}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isGenerating ? "Gerando Protocolo..." : "Gerar Protocolo"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
