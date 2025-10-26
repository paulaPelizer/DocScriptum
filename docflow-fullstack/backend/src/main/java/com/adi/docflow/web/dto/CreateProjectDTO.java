// src/main/java/com/adi/docflow/web/dto/CreateProjectDTO.java
package com.adi.docflow.web.dto;

import java.util.List;

public record CreateProjectDTO(
    String code,
    String name,
    Long clientId,

    String statusInicial,            // "ACTIVE" | "Em andamento" etc.
    String dataInicio,               // dd/MM/yyyy
    String dataPrevistaConclusao,    // dd/MM/yyyy

    List<DisciplinaInput> disciplinas,
    List<MarcoContratualInput> marcos
) {}
