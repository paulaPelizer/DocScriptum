// src/main/java/com/adi/docflow/web/dto/ResourceCreateDTO.java
package com.adi.docflow.web.dto;

import java.util.List;

/**
 * DTO usado no POST /api/v1/resources
 * Alinhado com o payload enviado pelo frontend:
 * { name, role, email, phone, orgType, orgName, status, tags, notes }
 */
public record CreateResourceDTO(
        String name,
        String role,
        String email,
        String phone,
        String orgType,   // "client" | "supplier" | "internal"
        String orgName,
        String status,    // "Ativo" | "Inativo"
        List<String> tags,
        String notes
) {}
