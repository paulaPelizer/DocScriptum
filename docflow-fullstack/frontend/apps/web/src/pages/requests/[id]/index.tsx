import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, FileText, Users, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { apiGet, apiPut } from "@/services/api"

/* ===== Tipos do backend (alinhados ao RequestResponseDTO) ===== */
type ApiOrganization = { id: number; name: string | null }
type ApiProject = { id: number; code?: string | null; name?: string | null }
type ApiDocument = { id: number; code?: string | null; title?: string | null; revision?: string | null }
type ApiStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED"
type ApiRequest = {
  id: number
  requestNumber: string
  project?: ApiProject | null
  origin?: ApiOrganization | null
  destination?: ApiOrganization | null
  purpose?: string | null
  description?: string | null
  requesterName?: string | null
  requesterContact?: string | null
  targetName?: string | null
  targetContact?: string | null
  requestDate?: string | null
  deadline?: string | null
  justification?: string | null
  specialInstructions?: string | null
  status: ApiStatus
  documents?: ApiDocument[]
}

/* ===== Tipos/UI helpers ===== */
type UiPriority = "Urgente" | "Alta" | "Normal" | "Baixa"
type BadgeVariant = "destructive" | "default" | "secondary" | "outline"

function priorityToBadge(p: UiPriority): BadgeVariant {
  if (p === "Urgente") return "destructive"
  if (p === "Alta") return "default"
  if (p === "Normal") return "secondary"
  return "outline"
}
const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : "—")
const uiStatus = (s?: ApiStatus) => {
  switch (s) {
    case "PENDING": return "Pendente"
    case "IN_PROGRESS": return "Em análise"
    case "COMPLETED": return "Concluída"
    case "REJECTED": return "Rejeitada"
    case "CANCELLED": return "Cancelada"
    default: return "—"
  }
}
const statusIcon = (s?: ApiStatus) => {
  switch (s) {
    case "PENDING":
    case "IN_PROGRESS":
      return <AlertCircle className="h-4 w-4 text-yellow-500" aria-hidden />
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-green-500" aria-hidden />
    case "REJECTED":
    case "CANCELLED":
      return <XCircle className="h-4 w-4 text-red-500" aria-hidden />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" aria-hidden />
  }
}

/** Mock estável de qualidade (70–100) a partir do id do documento */
function qualityFromId(id: number): number {
  let x = (id * 1103515245 + 12345) & 0x7fffffff
  return 70 + (x % 31)
}

/* ===== Indicador “desenhinho” por quartis ===== */
function quartile(pct: number) {
  if (pct < 25) return "Q1"
  if (pct < 50) return "Q2"
  if (pct < 75) return "Q3"
  return "Q4"
}
function QualityGlyph({ q }: { q: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(q)))
  const qtl = quartile(pct)
  const color =
    qtl === "Q1" ? "#ef4444" :
    qtl === "Q2" ? "#f59e0b" :
    qtl === "Q3" ? "#06b6d4" :
    "#22c55e"

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
    <div className="flex items-center gap-2 min-w-[150px]" title={`Qualidade ${pct}%`}>
      <svg width="28" height="12" viewBox="0 0 28 12" role="img" aria-label={`Qualidade ${pct}%`}>
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        {arrow && <path d={arrow} fill={color} />}
      </svg>
      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
    </div>
  )
}

export default function RequestDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [req, setReq] = useState<ApiRequest | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [comments, setComments] = useState("")

  // Prioridade (mock) → default “Normal”
  const priority: UiPriority = "Normal"
  const priorityVariant: BadgeVariant = priorityToBadge(priority)

  useEffect(() => {
    let abort = false
    const fetchData = async () => {
      if (!id) {
        setError("ID inválido.")
        setLoading(false)
        return
      }
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
    }
    fetchData()
    return () => { abort = true }
  }, [id])

  const documents = useMemo(
    () =>
      (req?.documents ?? []).map((d) => ({
        id: d.id!,
        code: d.code ?? `DOC-${d.id}`,
        name: d.title ?? "Documento",
        revision: d.revision ?? "—",
        quality: qualityFromId(d.id!),
      })),
    [req]
  )

  const projectName = req?.project?.name ?? "—"
  const projectCode = req?.project?.code ? `${req?.project?.code} — ` : ""
  const originName = req?.origin?.name ?? req?.requesterName ?? "—"
  const destinationName = req?.destination?.name ?? req?.targetName ?? "—"

  /** Aprovar → muda para IN_PROGRESS no backend e navega para gerar GRD */
  const handleApprove = async () => {
    if (!id) return
    setIsProcessing(true)
    setError(null)
    try {
      const updated = await apiPut<ApiRequest>(`/api/v1/requests/${id}/approve`, {})
      setReq(updated) // reflete mudança para IN_PROGRESS
      navigate(`/requests/${id}/generate-grd`)
    } catch (e) {
      console.error(e)
      setError("Não foi possível aprovar a solicitação.")
    } finally {
      setIsProcessing(false)
    }
  }

  /** Rejeitar → muda para REJECTED no backend e volta para a lista */
  const handleReject = async () => {
    if (!id) return
    setIsProcessing(true)
    setError(null)
    try {
      const body = comments?.trim() ? { reason: comments.trim() } : {}
      await apiPut<ApiRequest>(`/api/v1/requests/${id}/reject`, body as any)
      navigate("/requests")
    } catch (e) {
      console.error(e)
      setError("Não foi possível rejeitar a solicitação.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader
            title={`Solicitação ${req?.requestNumber ?? (id ? `#${id}` : "")}`}
            description="Detalhes da solicitação"
          >
            <Link to="/requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}

          {!loading && !error && req && (
            <div className="grid gap-6">
              {/* Informações Gerais */}
              <Card className="neon-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {statusIcon(req.status)}
                      Informações Gerais
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={priorityVariant}>{priority}</Badge>
                      <Badge variant="outline">{uiStatus(req.status)}</Badge>
                    </div>
                  </div>
                  <CardDescription className="sr-only">Status e prioridade da solicitação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Projeto</Label>
                      <p className="font-medium">{projectCode}{projectName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Propósito</Label>
                      <p className="font-medium">{req.purpose ?? "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Data da Solicitação</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {formatDate(req.requestDate)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Retorno Esperado</Label>
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                        {formatDate(req.deadline)}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                    <p className="mt-1">{req.description ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Origem e Destino */}
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" aria-hidden />
                    Origem e Destino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Solicitante</Label>
                      <p className="font-medium">{originName}</p>
                      <p className="text-sm text-muted-foreground">{req.requesterContact ?? ""}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Destinatário</Label>
                      <p className="font-medium">{destinationName}</p>
                      <p className="text-sm text-muted-foreground">{req.targetContact ?? ""}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documentos */}
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" aria-hidden />
                    Documentos ({documents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum documento vinculado.</div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">
                              {doc.code} — {doc.name}
                            </p>
                            <p className="text-sm text-muted-foreground">Rev. {doc.revision}</p>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Indicador de qualidade (mock por quartis) */}
                            <QualityGlyph q={doc.quality} />

                            <Button variant="outline" size="sm" aria-label={`Visualizar ${doc.code}`}>
                              Visualizar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Atendimento da Solicitação */}
              {(req.status === "PENDING" || req.status === "IN_PROGRESS") && (
                <Card className="neon-border">
                  <CardHeader>
                    <CardTitle>Atendimento da Solicitação</CardTitle>
                    <CardDescription>Analise a solicitação e tome uma decisão</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="comments">Comentários (opcional)</Label>
                      <Textarea
                        id="comments"
                        placeholder="Adicione comentários sobre a análise da solicitação..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isProcessing}
                        aria-disabled={isProcessing}
                      >
                        <XCircle className="mr-2 h-4 w-4" aria-hidden />
                        {isProcessing ? "Processando..." : "Rejeitar"}
                      </Button>
                      <Button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        aria-disabled={isProcessing}
                        className="neon-border"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" aria-hidden />
                        {isProcessing ? "Processando..." : "Aprovar e Gerar GRD"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
