// src/main/java/com/adi/docflow/web/dto/CreateProjectDTO.java
package com.adi.docflow.web.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

public record CreateProjectDTO(

        String code,
        String name,
        Long clientId,

        String statusInicial,
        String dataInicio,             // dd/MM/yyyy
        String dataPrevistaConclusao,  // dd/MM/yyyy

        String description,

        List<DisciplineDTO> disciplinas,
        List<MarcoContratualInput> marcos
) {

    // ---------- DISCIPLINAS ----------
    public record DisciplineDTO(

            @Schema(description = "ID da disciplina (lookup)")
            Long disciplinaId,

            @Schema(description = "Nome da disciplina")
            String disciplinaNome,

            @Schema(description = "Destinatário no cliente (nome + e-mail)")
            String destinatarioCliente,

            @Schema(description = "Destinatário interno (nome + e-mail)")
            String destinatarioInterno,

            List<TipoDTO> tipos
    ) {}

    // ---------- TIPOS DE DOCUMENTO ----------
    public record TipoDTO(
            String tipo,
            Integer quantidade
    ) {}

    // ---------- MARCOS CONTRATUAIS ----------
    public record MarcoContratualInput(
            String marcoContratual,
            String dataLimite,
            String descricao
    ) {}
}
