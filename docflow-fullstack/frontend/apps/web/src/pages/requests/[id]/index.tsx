import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, Users, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { PageHeader } from "@/components/page-header";

type Doc = { id: number; code: string; name: string; revision: string };
type RequestData = {
  id?: string;
  requestNumber: string;
  project: string;
  origin: string;
  destination: string;
  purpose: string;
  description: string;
  priority: "Urgente" | "Alta" | "Normal" | "Baixa";
  status: "Pendente" | "Aprovada" | "Rejeitada";
  requestDate: string;
  expectedReturn: string;
  requesterContact: string;
  targetContact: string;
  documents: Doc[];
  justification: string;
  specialInstructions: string;
};

export default function RequestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [comments, setComments] = useState("");

  // Simulação de dados da solicitação (useMemo para evitar recriação em re-render)
  const request: RequestData = useMemo(
    () => ({
      id,
      requestNumber: "REQ-2025001",
      project: "Projeto Alpha",
      origin: "Empresa ABC (Cliente)",
      destination: "Construtora XYZ (Fornecedor)",
      purpose: "Aprovação inicial",
      description:
        "Solicitação de aprovação dos documentos iniciais do projeto para dar continuidade às próximas etapas.",
      priority: "Alta",
      status: "Pendente",
      requestDate: "10/05/2025",
      expectedReturn: "15/05/2025",
      requesterContact: "João Silva - joao@empresaabc.com",
      targetContact: "Carlos Mendes - carlos@construtoraXYZ.com",
      documents: [
        { id: 1, code: "DOC-001", name: "Planta Baixa - Térreo", revision: "Rev. 2" },
        { id: 2, code: "DOC-002", name: "Memorial Descritivo", revision: "Rev. 1" },
        { id: 3, code: "DOC-004", name: "Cronograma Executivo", revision: "Rev. 1" },
      ],
      justification:
        "Necessário para dar continuidade ao cronograma do projeto e evitar atrasos na execução.",
      specialInstructions:
        "Verificar especialmente as cotas da planta baixa e os prazos do cronograma.",
    }),
    [id]
  );

  const handleApprove = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
    navigate(`/requests/${id ?? ""}/generate-grd`);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
    navigate("/requests");
  };

  const getStatusIcon = (status: RequestData["status"]) => {
    switch (status) {
      case "Pendente":
        return <AlertCircle className="h-4 w-4 text-yellow-500" aria-hidden />;
      case "Aprovada":
        return <CheckCircle className="h-4 w-4 text-green-500" aria-hidden />;
      case "Rejeitada":
        return <XCircle className="h-4 w-4 text-red-500" aria-hidden />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" aria-hidden />;
    }
  };

  const getPriorityVariant = (
    priority: RequestData["priority"]
  ): "destructive" | "default" | "secondary" | "outline" => {
    switch (priority) {
      case "Urgente":
        return "destructive";
      case "Alta":
        return "default";
      case "Normal":
        return "secondary";
      case "Baixa":
      default:
        return "outline";
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          <PageHeader title={`Solicitação ${request.requestNumber}`} description="Detalhes da solicitação">
            <Link to="/requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Voltar
              </Button>
            </Link>
          </PageHeader>

          <div className="grid gap-6">
            <Card className="neon-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    Informações Gerais
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityVariant(request.priority)}>{request.priority}</Badge>
                    <Badge variant="outline">{request.status}</Badge>
                  </div>
                </div>
                <CardDescription className="sr-only">Status e prioridade da solicitação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Projeto</Label>
                    <p className="font-medium">{request.project}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Propósito</Label>
                    <p className="font-medium">{request.purpose}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data da Solicitação</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {request.requestDate}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Retorno Esperado</Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {request.expectedReturn}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                  <p className="mt-1">{request.description}</p>
                </div>
              </CardContent>
            </Card>

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
                    <p className="font-medium">{request.origin}</p>
                    <p className="text-sm text-muted-foreground">{request.requesterContact}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Destinatário</Label>
                    <p className="font-medium">{request.destination}</p>
                    <p className="text-sm text-muted-foreground">{request.targetContact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="neon-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" aria-hidden />
                  Documentos ({request.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {request.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">
                          {doc.code} — {doc.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{doc.revision}</p>
                      </div>
                      <Button variant="outline" size="sm" aria-label={`Visualizar ${doc.code}`}>
                        Visualizar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="neon-border">
              <CardHeader>
                <CardTitle>Detalhes Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Justificativa</Label>
                  <p className="mt-1">{request.justification}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Instruções Especiais</Label>
                  <p className="mt-1">{request.specialInstructions}</p>
                </div>
              </CardContent>
            </Card>

            {request.status === "Pendente" && (
              <Card className="neon-border">
                <CardHeader>
                  <CardTitle>Processamento da Solicitação</CardTitle>
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
                    <Button variant="destructive" onClick={handleReject} disabled={isProcessing} aria-disabled={isProcessing}>
                      <XCircle className="mr-2 h-4 w-4" aria-hidden />
                      {isProcessing ? "Processando..." : "Rejeitar"}
                    </Button>
                    <Button onClick={handleApprove} disabled={isProcessing} aria-disabled={isProcessing} className="neon-border">
                      <CheckCircle className="mr-2 h-4 w-4" aria-hidden />
                      {isProcessing ? "Processando..." : "Aprovar e Gerar GRD"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
