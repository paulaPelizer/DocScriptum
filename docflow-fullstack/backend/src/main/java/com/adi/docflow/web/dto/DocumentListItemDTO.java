// src/main/java/com/app/api/documents/dto/DocumentListItemDTO.java
package com.adi.docflow.web.dto;

import java.time.Instant;

public record DocumentListItemDTO(
        Long id,
        String code,
        String title,
        String revision,
        String format,
        String currentLocation,
        String status,
        Instant updatedAt,
        Long projectId,
        String projectName,
        String uploadHash 
) {}
