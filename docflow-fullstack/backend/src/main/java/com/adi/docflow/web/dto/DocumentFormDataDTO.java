// src/main/java/com/adi/docflow/web/dto/DocumentFormDataDTO.java
package com.adi.docflow.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFormDataDTO {
    private List<ProjectSummaryDTO> projects;   // <<< trocado para Summary
    private List<DisciplineDTO> disciplines;
    private List<DocTypeDTO> docTypes;
    private List<SimpleIdNameDTO> responsibles;
    private List<SimpleIdNameDTO> clients;
    private List<SimpleIdNameDTO> suppliers;
}
