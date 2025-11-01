package com.adi.docflow.web.dto;

public class MilestoneDTO {
    private Long id;
    private String name;
    private String description;
    private String dueDate;   // dd/MM/yyyy
    private Long projectId;   // <- para sabermos a que projeto pertence

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }  // <-- existe!
}
