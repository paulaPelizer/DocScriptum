import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, XCircle, FileText } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"
import { Checkbox } from "@/components/ui/checkbox"

type RequestDoc = { id: number; name: string; disciplina: string }
type SelectedRequest = {
  id: number
  requestNumber: string
  project: string
  projectId: number
  origin: string
  destination: string
  purpose: string
  documents: RequestDoc[]
  status: string
}

type ProjectDestinatarios = {
  cliente: number[]
  fornecedor: number[]
  interno: number[]
}

type ProjectData = {
  id: number
  name: string
  disciplinas: { id: number; name: string; destinatarios: ProjectDestinatarios }[]
}

type DecodedToken = {
  roles?: string // ex.: "ROLE_DBA,ROLE_ADMIN,ROLE_RESOURCE"
  [key: string]: any
}

// 👉 Apenas DBA e ADMIN podem atender solicitações
const ATTEND_ALLOWED_ROLES = ["ROLE_DBA", "ROLE_ADMIN"]

function decodeJwt(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(base64)
    return JSON.parse(json) as DecodedToken
  } catch (err) {
    console.error("Erro ao decodificar JWT:", err)
    return null
  }
}

function hasAttendPermission(): boolean {
  const token = localStorage.getItem("authToken")
  if (!token) return false

  const decoded = decodeJwt(token)
  if (!decoded || !decoded.roles) return false

  const roles = decoded.roles
    .split(/[,\s;]+/)
    .map((r: string) => r.trim())
    .filter(Boolean)

  console.log("JWT roles:", decoded.roles, "rolesArray:", roles)

  return roles.some((r) => ATTEND_ALLOWED_ROLES.includes(r))
}

export default function AttendRequestsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [isProcessing, setIsProcessing] = useState(false)
  const [comments, setComments] = useState("")
  const [selectedRequests, setSelectedRequests] = useState<SelectedRequest[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([])
  const [projectData, setProjectData] = useState<ProjectData | null>(null)

  const canAttend = hasAttendPermission()

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").map(Number) || []

    // Simulação de dados das solicitações selecionadas
    const mockRequests: SelectedRequest[] = [
      {
        id: 1,
        requestNumber: "REQ-2025001",
        project: "Projeto Alpha",
        projectId: 1,
        origin: "Empresa ABC (Cliente)",
        destination: "Construtora XYZ (Fornecedor)",
        purpose: "Aprovação inicial",
        documents: [
          { id: 1, name: "Planta Baixa - Térreo", disciplina: "Civil" },
          { id: 2, name: "Memorial Descritivo Civil", disciplina: "Civil" },
          { id: 3, name: "Projeto Elétrico - Baixa Tensão", disciplina: "Elétrica" },
        ],
        status: "Pendente",
      },
      {
        id: 4,
        requestNumber: "REQ-2025004",
        project: "Projeto Beta",
        projectId: 2,
        origin: "Interno",
        destination: "Empresa DEF (Cliente)",
        purpose: "Envio de documentação técnica",
        documents: [
          { id: 4, name: "Projeto Hidráulico", disciplina: "Hidráulica" },
          { id: 5, name: "Memorial Descritivo Hidráulico", disciplina: "Hidráulica" },
        ],
        status: "Pendente",
      },
    ]

    const filtered = mockRequests.filter((req) => ids.includes(req.id))
    setSelectedRequests(filtered)

    // Simular dados do projeto (normalmente viria da API)
    const mockProjectData: ProjectData = {
      id: 1,
      name: "Projeto Alpha",
      disciplinas: [
        {
          id: 1,
          name: "Civil",
          destinatarios: {
            cliente: [1, 2],
            fornecedor: [4],
            interno: [7, 8],
          },
        },
        {
          id: 2,
          name: "Elétrica",
          destinatarios: {
            cliente: [1],
            fornecedor: [4, 5],
            interno: [7],
          },
        },
        {
          id: 3,
          name: "Hidráulica",
          destinatarios: {
            cliente: [2],
            fornecedor: [5],
            interno: [8, 9],
          },
        },
      ],
    }

    setProjectData(mockProjectData)

    // Selecionar todos os documentos por padrão
    const allDocuments = filtered.flatMap((req) => req.documents.map((doc) => doc.id))
    setSelectedDocuments(allDocuments)
  }, [searchParams])

  // Usuários disponíveis
  const userGroups = {
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
  }

  const handleDocumentToggle = (docId: number) => {
    setSelectedDocuments((prev) => (prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]))
  }

  const handleSelectAllDocuments = () => {
    const allDocuments = selectedRequests.flatMap((req) => req.documents.map((doc) => doc.id))
    if (selectedDocuments.length === allDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(allDocuments)
    }
  }

  const getDestinatariosForDisciplina = (disciplina: string) => {
    if (!projectData) return { cliente: [], fornecedor: [], interno: [] as number[] }
    const disciplinaData = projectData.disciplinas.find((d) => d.name === disciplina)
    return disciplinaData ? disciplinaData.destinatarios : { cliente: [], fornecedor: [], interno: [] as number[] }
  }

  const getSelectedDocumentsByDisciplina = () => {
    const documentsByDisciplina: Record<string, RequestDoc[]> = {}
    selectedRequests.forEach((request) => {
      request.documents.forEach((doc) => {
        if (selectedDocuments.includes(doc.id)) {
          if (!documentsByDisciplina[doc.disciplina]) {
            documentsByDisciplina[doc.disciplina] = []
          }
          documentsByDisciplina[doc.disciplina].push(doc)
        }
      })
    })
    return documentsByDisciplina
  }

  const handleApproveAll = async () => {
    if (selectedDocuments.length === 0) {
      alert("Selecione pelo menos um documento para processar")
      return
    }

    setIsProcessing(true)
    // Simular processamento
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)

    // Redirecionar para geração de GRDs em lote
    const ids = selectedRequests.map((req) => req.id).join(",")
    const docs = selectedDocuments.join(",")
    navigate(`/requests/attend/generate-grds?ids=${ids}&docs=${docs}`)
  }

  const handleRejectAll = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsProcessing(false)
    navigate("/requests")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader
            title="Atender Solicitações"
            description={`Processar ${selectedRequests.length} solicitação${
              selectedRequests.length === 1 ? "" : "ões"
            } selecionada${selectedRequests.length === 1 ? "" : "s"}`}
          >
            <Link to="/requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          <div className="space-y-6">
            {/* Solicitações Selecionadas */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Solicitações Selecionadas</CardTitle>
                <CardDescription>Revise as solicitações que serão processadas em lote</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{request.requestNumber}</h3>
                        <Badge variant="outline">{request.status}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p>
                          <strong>Projeto:</strong> {request.project}
                        </p>
                        <p>
                          <strong>Documentos:</strong> {request.documents.length}
                        </p>
                        <p>
                          <strong>Origem:</strong> {request.origin}
                        </p>
                        <p>
                          <strong>Destino:</strong> {request.destination}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Propósito:</strong> {request.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Documentos */}
            <Card className="neon-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documentos das Solicitações</CardTitle>
                    <CardDescription>Selecione quais documentos serão processados</CardDescription>
                  </div>
                  <Button onClick={handleSelectAllDocuments} variant="outline" size="sm">
                    {selectedDocuments.length === selectedRequests.flatMap((req) => req.documents).length
                      ? "Desmarcar Todos"
                      : "Selecionar Todos"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{request.requestNumber}</h4>
                      <div className="space-y-2">
                        {request.documents.map((document) => (
                          <div key={document.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={`doc-${document.id}`}
                              checked={selectedDocuments.includes(document.id)}
                              onCheckedChange={() => handleDocumentToggle(document.id)}
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <Label htmlFor={`doc-${document.id}`} className="flex-1">
                                {document.name}
                              </Label>
                              <Badge variant="secondary" className="text-xs">
                                {document.disciplina}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Destinatários por Disciplina */}
            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Destinatários por Disciplina</CardTitle>
                <CardDescription>Destinatários cadastrados no projeto para cada disciplina selecionada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(getSelectedDocumentsByDisciplina()).map(([disciplina, documents]) => {
                    const destinatarios = getDestinatariosForDisciplina(disciplina)
                    return (
                      <div key={disciplina} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">{disciplina}</h4>
                          <Badge variant="outline">{documents.length} documento(s)</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(userGroups).map(([groupType, users]) => (
                            <div key={groupType} className="space-y-2">
                              <Label className="text-sm font-medium capitalize">{groupType}</Label>
                              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                                {users
                                  .filter((user) =>
                                    destinatarios[groupType as keyof ProjectDestinatarios]?.includes(user.id)
                                  )
                                  .map((user) => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                      <Checkbox id={`${disciplina}-${groupType}-${user.id}`} defaultChecked />
                                      <Label htmlFor={`${disciplina}-${groupType}-${user.id}`} className="text-xs">
                                        {user.name}
                                        <br />
                                        <span className="text-muted-foreground">{user.email}</span>
                                      </Label>
                                    </div>
                                  ))}
                                {destinatarios[groupType as keyof ProjectDestinatarios]?.length === 0 && (
                                  <p className="text-xs text-muted-foreground">Nenhum destinatário cadastrado</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 text-xs text-muted-foreground">
                          <strong>Documentos:</strong> {documents.map((doc) => doc.name).join(", ")}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Atendimento em Lote – só DBA e ADMIN enxergam */}
            {canAttend && (
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Atendimento em Lote</CardTitle>
                  <CardDescription>Analise e tome uma decisão para todas as solicitações selecionadas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-comments">Comentários (aplicado a todas as solicitações)</Label>
                    <Textarea
                      id="batch-comments"
                      placeholder="Adicione comentários sobre a análise das solicitações..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Resumo da Ação:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Solicitações:</strong> {selectedRequests.length}
                      </li>
                      <li>
                        • <strong>Documentos selecionados:</strong> {selectedDocuments.length}
                      </li>
                      <li>
                        • <strong>Disciplinas envolvidas:</strong>{" "}
                        {Object.keys(getSelectedDocumentsByDisciplina()).join(", ")}
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4 justify-end pt-4">
                    <Button variant="destructive" onClick={handleRejectAll} disabled={isProcessing}>
                      <XCircle className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processando..." : "Rejeitar Todas"}
                    </Button>
                    <Button onClick={handleApproveAll} disabled={isProcessing} className="neon-border">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processando..." : "Aprovar e Gerar GRDs"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

