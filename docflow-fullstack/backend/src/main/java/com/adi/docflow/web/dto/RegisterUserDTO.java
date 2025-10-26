// src/main/java/com/adi/docflow/web/dto/RegisterUserDTO.java
package com.adi.docflow.web.dto;

import java.util.Set;

public record RegisterUserDTO(
  String username,
  String password,
  String fullName,
  String profile,         // "INTERNO" | "EXTERNO" | "INTERMEDIARIO" | "ADMIN"
  Long clientId,          // opcional
  Long supplierId,        // opcional
  Set<Long> projectIds    // obrigatório: pelo menos 1
) {}
