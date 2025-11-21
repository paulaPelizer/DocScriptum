package com.adi.docflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "project_discipline_doc_type", schema = "app")
public class ProjectDisciplineDocType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_discipline_id", nullable = false)
    private ProjectDiscipline projectDiscipline;

    @Column(name = "doc_type", nullable = false)
    private String docType;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // ================== CONSTRUCTORS ==================

    public ProjectDisciplineDocType() {
        // JPA needs a no-args constructor
    }

    // (opcional, se quiser usar em testes/criação manual)
    public ProjectDisciplineDocType(ProjectDiscipline projectDiscipline,
                                    String docType,
                                    Integer quantity) {
        this.projectDiscipline = projectDiscipline;
        this.docType = docType;
        this.quantity = quantity;
    }

    // ================== GETTERS/SETTERS ==================

    public Long getId() {
        return id;
    }

    // setId é opcional; só inclua se você realmente precisar
    public void setId(Long id) {
        this.id = id;
    }

    public ProjectDiscipline getProjectDiscipline() {
        return projectDiscipline;
    }

    public void setProjectDiscipline(ProjectDiscipline projectDiscipline) {
        this.projectDiscipline = projectDiscipline;
    }

    public String getDocType() {
        return docType;
    }

    public void setDocType(String docType) {
        this.docType = docType;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
