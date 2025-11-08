// src/main/java/com/adi/docflow/web/dto/ResourceSummaryDTO.java
package com.adi.docflow.web.dto;

import java.util.List;

public record ResourceSummaryDTO(
        Long id,
        String name,
        String role,
        String email,
        String phone,
        String partnershipType,   // "CLIENT" | "SUPPLIER" | "INTERNAL"
        String partnershipName,   // nome da parceria (cliente/fornecedor/interno)
        String status,            // "ATIVO" | "INATIVO"
        List<String> tags,
        String notes
) {}
