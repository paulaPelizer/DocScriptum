package com.adi.docflow.web.dto;

public class ProjectDocTypeDTO {

    // id do registro em project_discipline_doc_type
    private Long id;

    // id da disciplina (project_discipline.id)
    private Long projectDisciplineId;

    // nome da disciplina (vem de ProjectDiscipline)
    private String disciplineName;

    // tipo de documento previsto (coluna doc_type)
    private String docType;

    // quantidade prevista
    private Integer quantity;

    public ProjectDocTypeDTO() {
    }

    public ProjectDocTypeDTO(Long id,
                             Long projectDisciplineId,
                             String disciplineName,
                             String docType,
                             Integer quantity) {
        this.id = id;
        this.projectDisciplineId = projectDisciplineId;
        this.disciplineName = disciplineName;
        this.docType = docType;
        this.quantity = quantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProjectDisciplineId() {
        return projectDisciplineId;
    }

    public void setProjectDisciplineId(Long projectDisciplineId) {
        this.projectDisciplineId = projectDisciplineId;
    }

    public String getDisciplineName() {
        return disciplineName;
    }

    public void setDisciplineName(String disciplineName) {
        this.disciplineName = disciplineName;
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
