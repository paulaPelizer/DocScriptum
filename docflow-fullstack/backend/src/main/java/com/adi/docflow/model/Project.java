// src/main/java/com/adi/docflow/model/Project.java
package com.adi.docflow.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "project", schema = "app")
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true)
    private String code;

    @Column(name = "name")
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Organization client;

    // novos
    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // relacionamentos auxiliares (opcional manter lado inverso aqui)
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectDiscipline> disciplines;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectMilestone> milestones;

    // imports: jakarta.persistence.PrePersist; jakarta.persistence.PreUpdate;
    // imports: java.time.Instant;
    
    @PrePersist
    public void onCreate() {
      if (this.getUpdatedAt() == null) {
        this.setUpdatedAt(Instant.now());
      }
    }
    
    @PreUpdate
    public void onUpdate() {
      this.setUpdatedAt(Instant.now());
    }
    
    // getters/setters
    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Organization getClient() { return client; }
    public void setClient(Organization client) { this.client = client; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getPlannedEndDate() { return plannedEndDate; }
    public void setPlannedEndDate(LocalDate plannedEndDate) { this.plannedEndDate = plannedEndDate; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<ProjectDiscipline> getDisciplines() { return disciplines; }
    public void setDisciplines(List<ProjectDiscipline> disciplines) { this.disciplines = disciplines; }
    public List<ProjectMilestone> getMilestones() { return milestones; }
    public void setMilestones(List<ProjectMilestone> milestones) { this.milestones = milestones; }
}
