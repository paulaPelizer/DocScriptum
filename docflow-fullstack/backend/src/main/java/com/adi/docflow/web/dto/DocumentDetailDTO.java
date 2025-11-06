// src/main/java/com/adi/docflow/web/dto/DocumentDetailDTO.java
package com.adi.docflow.web.dto;

public record DocumentDetailDTO(
        Long id,
        String code,
        String title,
        String name,
        String revision,
        String format,
        String currentLocation,
        String status,
        String updatedAt,             // <- String p/ evitar mismatch de tipos
        String description,
        String fileUrl,
        Integer pages,
        String performedDate,         // <- String
        String dueDate,               // <- String
        String technicalResponsible,
        ProjectSummaryDTO project
) {}
