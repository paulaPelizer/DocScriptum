package com.adi.docflow.web.dto;

import java.util.List;

public class ProjectDetailDTO {
    private Long id;
    private String code;
    private String name;
    private String clientName;
    private String description;          // pode ser null se não existir no model
    private String status;
    private String startDate;            // dd/MM/yyyy
    private String plannedEndDate;       // dd/MM/yyyy

    // Marcos contratuais
    private List<MilestoneDTO> milestones;

    // Documentos reais (pode continuar sendo usado em outra parte do sistema, se precisar)
    private List<DocumentDTO> documents;

    // ✅ NOVO: tipos de documentos previstos por disciplina do projeto
    // (virão da tabela project_discipline_doc_type)
    private List<ProjectDocTypeDTO> plannedDocTypes;

    public ProjectDetailDTO() {}

    public ProjectDetailDTO(Long id, String code, String name, String clientName,
                            String description, String status, String startDate,
                            String plannedEndDate, List<MilestoneDTO> milestones,
                            List<DocumentDTO> documents) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.clientName = clientName;
        this.description = description;
        this.status = status;
        this.startDate = startDate;
        this.plannedEndDate = plannedEndDate;
        this.milestones = milestones;
        this.documents = documents;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getPlannedEndDate() { return plannedEndDate; }
    public void setPlannedEndDate(String plannedEndDate) { this.plannedEndDate = plannedEndDate; }

    public List<MilestoneDTO> getMilestones() { return milestones; }
    public void setMilestones(List<MilestoneDTO> milestones) { this.milestones = milestones; }

    public List<DocumentDTO> getDocuments() { return documents; }
    public void setDocuments(List<DocumentDTO> documents) { this.documents = documents; }

    // ✅ getters/setters para os tipos previstos

    public List<ProjectDocTypeDTO> getPlannedDocTypes() {
        return plannedDocTypes;
    }

    public void setPlannedDocTypes(List<ProjectDocTypeDTO> plannedDocTypes) {
        this.plannedDocTypes = plannedDocTypes;
    }
}
