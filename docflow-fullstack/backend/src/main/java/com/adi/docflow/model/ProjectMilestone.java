// src/main/java/com/adi/docflow/model/ProjectMilestone.java
package com.adi.docflow.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "project_milestone", schema = "app")
public class ProjectMilestone {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "name", nullable = false)
    private String name; // marco_contratual

    @Column(name = "due_date")
    private LocalDate dueDate; // data_limite

    @Column(name = "description")
    private String description; // descricao

    // getters/setters
    public Long getId() { return id; }
    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
