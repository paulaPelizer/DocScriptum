// src/main/java/com/adi/docflow/web/dto/CreateProjectDTO.java
package com.adi.docflow.web.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

public record CreateProjectDTO(
    String code,
    String name,
    Long clientId,

    String statusInicial,            // "ACTIVE" | "Em andamento" etc.
    String dataInicio,               // dd/MM/yyyy
    String dataPrevistaConclusao,    // dd/MM/yyyy

    
    String description,   // <— NOVO
    // se você preferir, aceite também "descricao":
    // private String descricao;

    List<DisciplineDTO> disciplinas,
    List<MarcoContratualInput> marcos
) {}
