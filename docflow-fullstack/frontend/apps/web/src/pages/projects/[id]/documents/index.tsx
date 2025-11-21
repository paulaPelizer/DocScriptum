// src/pages/projects/[id]/documents/index.tsx
import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"

import AppHeader from "@/components/AppHeader"
import { PageHeader } from "@/components/page-header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { ArrowLeft, Search, FileText } from "lucide-react"

import { getProjectDetail, ProjectDetail, ProjectDocType } from "@/services/projects"

export default function ProjectDocumentsPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!id) {
      setError("Projeto não informado.")
      setLoading(false)
      return
    }

    const projectId = Number(id)
    if (Number.isNaN(projectId)) {
      setError("ID de projeto inválido.")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getProjectDetail(projectId)
      .then((data) => {
        // DEBUG: ver no console se o back está trazendo plannedDocTypes
        console.log("Project detail (documents page):", data)
        setProject(data)
      })
      .catch((err) => {
        console.error("Erro ao carregar detalhes do projeto:", err)
        setError("Erro ao carregar os dados do projeto.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  // lista de tipos previstos vindos do backend
  const plannedDocTypes: ProjectDocType[] = project?.plannedDocTypes ?? []

  const filteredDocTypes = useMemo(() => {
    if (!search.trim()) return plannedDocTypes

    const s = search.toLowerCase()

    return plannedDocTypes.filter((d) => {
      const disc = d.disciplineName?.toLowerCase() ?? ""
      const tipo = d.docType?.toLowerCase() ?? ""
      return disc.includes(s) || tipo.includes(s)
    })
  }, [plannedDocTypes, search])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho unificado com efeito vidro e logo/menu */}
      <AppHeader />

      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-6xl">
          <PageHeader
            title={
              project
                ? `Documentos - ${project.name}`
                : "Documentos do Projeto"
            }
            description="Lista de tipos de documentos previstos para este projeto."
          >
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <Link to="/projects">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="relative w-full sm:w-[260px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por disciplina ou tipo..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </PageHeader>

          <Card className="neon-border border border-border/70 bg-background/70 dark:bg-card/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Tipos de documentos previstos</CardTitle>
              <CardDescription>
                Tipos de documentos cadastrados por disciplina para este projeto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <p className="text-sm text-muted-foreground">
                  Carregando tipos de documentos...
                </p>
              )}

              {!loading && error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {!loading && !error && filteredDocTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum tipo de documento previsto encontrado para este projeto.
                </p>
              )}

              {!loading && !error && filteredDocTypes.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Tipo de documento</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocTypes.map((docType) => (
                      <TableRow key={docType.id}>
                        <TableCell className="font-medium">
                          {docType.disciplineName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{docType.docType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {docType.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
