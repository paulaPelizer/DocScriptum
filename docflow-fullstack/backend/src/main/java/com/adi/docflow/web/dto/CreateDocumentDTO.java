package com.adi.docflow.web.dto;

public record CreateDocumentDTO(
    Long projectId,   // obrigatório
    String code,      // obrigatório
    String title,     // obrigatório (mapeia para coluna "name")
    String revision,  // obrigatório (String, ex: "00", "1")
    String format,    // opcional
    Integer pages,    // opcional
    String fileUrl    // opcional
) {}
