// src/main/java/com/adi/docflow/web/dto/ProjectSummaryDTO.java
package com.adi.docflow.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO leve para listagens (id, code, name). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSummaryDTO {
    private Long id;
    private String code;
    private String name;
}
