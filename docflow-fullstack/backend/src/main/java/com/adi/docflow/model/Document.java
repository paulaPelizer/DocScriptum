package com.adi.docflow.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "document", schema = "app")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Deixe nullable = true por enquanto para lidar com legados sem vínculo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    @Column(name = "code", nullable = false)
    private String code;

    // "title" mapeia para a coluna "name" no banco
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

    // === NOVO: status do documento ===
    @Column(name = "status", length = 30)
    private String status = "PLANNED"; // padrão inicial para placeholders

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
