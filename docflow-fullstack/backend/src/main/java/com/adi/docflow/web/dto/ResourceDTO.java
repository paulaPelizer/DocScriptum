// src/main/java/com/adi/docflow/web/dto/ResourceDTO.java
package com.adi.docflow.web.dto;

import java.util.List;

public record ResourceDTO(
        Long id,
        String name,
        String role,
        String status,
        String email,
        String phone,
        String partnershipType,
        String partnershipName,
        List<String> tags,
        String notes
) {}
