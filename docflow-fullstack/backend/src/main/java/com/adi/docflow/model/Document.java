package com.adi.docflow.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "document", schema = "app")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mantém relacionamento existente
    // nullable = true para lidar com legados sem vínculo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    @Column(name = "code", nullable = false)
    private String code;

    // "title" mapeia para a coluna "name" no banco (mantido)
    @Column(name = "name", nullable = false)
    private String title;

    @Column(name = "revision", nullable = false)
    private String revision;

    @Column(name = "format")
    private String format;

    @Column(name = "pages")
    private Integer pages;

    @Column(name = "file_url")
    private String fileUrl;

    // === status existente (usado como "Status Inicial") ===
    @Column(name = "status", length = 30)
    private String status = "PLANNED";

    // =========================
    // NOVOS CAMPOS (formulário)
    // =========================

    // IDs auxiliares vindos dos GETs do formulário
    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "discipline_id")
    private Long disciplineId;

    @Column(name = "document_type_id")
    private Long documentTypeId;

    // Informações do documento
    @Column(name = "species", length = 120)
    private String species; // "Espécie de Documento"

    // Em SQL Server usamos VARCHAR(MAX); columnDefinition garante mapeamento.
    // Se preferir portabilidade, pode remover o columnDefinition.
    @Column(name = "description", columnDefinition = "VARCHAR(MAX)")
    private String description;

    @Column(name = "layout_ref", length = 120)
    private String layoutRef; // "Layout (ISO/Referência)"

    @Column(name = "template_id")
    private Long templateId;  // se o template for entidade depois, podemos relacionar

    // Responsabilidade e prazos
    @Column(name = "technical_responsible", length = 150)
    private String technicalResponsible;

    @Column(name = "performed_date")
    private LocalDate performedDate; // "Data Realizado"

    @Column(name = "due_date")
    private LocalDate dueDate;       // "Data Prevista"

    // Status/Localização/Observações adicionais
    @Column(name = "current_location", length = 60)
    private String currentLocation; // "Localização Atual"

    @Column(name = "remarks", columnDefinition = "VARCHAR(MAX)")
    private String remarks;         // "Observações"

    // Upload (hash fictícia por enquanto)
    @Column(name = "upload_hash", length = 120)
    private String uploadHash;

    // === timestamps ===
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // === lifecycle hooks para timestamps automáticos ===
    @PrePersist
    public void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = "PLANNED";
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = Instant.now();
    }

    // === getters / setters ===
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRevision() { return revision; }
    public void setRevision(String revision) { this.revision = revision; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public Integer getPages() { return pages; }
    public void setPages(Integer pages) { this.pages = pages; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public Long getDisciplineId() { return disciplineId; }
    public void setDisciplineId(Long disciplineId) { this.disciplineId = disciplineId; }

    public Long getDocumentTypeId() { return documentTypeId; }
    public void setDocumentTypeId(Long documentTypeId) { this.documentTypeId = documentTypeId; }

    public String getSpecies() { return species; }
    public void setSpecies(String species) { this.species = species; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLayoutRef() { return layoutRef; }
    public void setLayoutRef(String layoutRef) { this.layoutRef = layoutRef; }

    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }

    public String getTechnicalResponsible() { return technicalResponsible; }
    public void setTechnicalResponsible(String technicalResponsible) { this.technicalResponsible = technicalResponsible; }

    public LocalDate getPerformedDate() { return performedDate; }
    public void setPerformedDate(LocalDate performedDate) { this.performedDate = performedDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getUploadHash() { return uploadHash; }
    public void setUploadHash(String uploadHash) { this.uploadHash = uploadHash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
