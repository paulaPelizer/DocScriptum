// src/main/java/com/adi/docflow/model/ProjectDiscipline.java
package com.adi.docflow.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "project_discipline", schema = "app")
public class ProjectDiscipline {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "disciplina_id")
    private Long disciplinaId;

    @Column(name = "disciplina_nome", nullable = false)
    private String disciplinaNome;

    @Column(name = "destinatario_cliente")
    private String destinatarioCliente;

    @Column(name = "destinatario_interno")
    private String destinatarioInterno;

    @OneToMany(mappedBy = "projectDiscipline", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectDisciplineDocType> docTypes;

    // getters/setters
    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public Long getDisciplinaId() { return disciplinaId; }
    public void setDisciplinaId(Long disciplinaId) { this.disciplinaId = disciplinaId; }
    public String getDisciplinaNome() { return disciplinaNome; }
    public void setDisciplinaNome(String disciplinaNome) { this.disciplinaNome = disciplinaNome; }
    public String getDestinatarioCliente() { return destinatarioCliente; }
    public void setDestinatarioCliente(String destinatarioCliente) { this.destinatarioCliente = destinatarioCliente; }
    public String getDestinatarioInterno() { return destinatarioInterno; }
    public void setDestinatarioInterno(String destinatarioInterno) { this.destinatarioInterno = destinatarioInterno; }
    public List<ProjectDisciplineDocType> getDocTypes() { return docTypes; }
    public void setDocTypes(List<ProjectDisciplineDocType> docTypes) { this.docTypes = docTypes; }
}
