package com.adi.docflow.web.dto;

/**
 * DTO para criação de novos documentos.
 * Mantém compatibilidade com os campos antigos e adiciona todos os novos do formulário.
 */
public record CreateDocumentDTO(

    // === campos obrigatórios existentes ===
    Long projectId,     // id do projeto (obrigatório)
    String code,        // código do documento (obrigatório)
    String title,       // nome/título (obrigatório, mapeia para "name")
    String revision,    // revisão (obrigatório, ex: "00", "1")

    // === campos opcionais antigos ===
    String format,      // formato (A1, PDF, etc)
    Integer pages,      // número de páginas
    String fileUrl,     // URL ou caminho do arquivo

    // === novos campos de vínculo e classificação ===
    Long clientId,          // id do cliente do projeto
    Long disciplineId,      // id da disciplina selecionada
    Long documentTypeId,    // id do tipo de documento

    // === novas informações do documento ===
    String species,         // espécie do documento (Relatório, Desenho, etc)
    String description,     // descrição detalhada
    String layoutRef,       // layout ISO / referência
    Long templateId,        // id do template (se existir)

    // === responsabilidade e prazos ===
    String technicalResponsible, // responsável técnico
    String performedDate,        // data realizado (dd/MM/yyyy)
    String dueDate,              // data prevista (dd/MM/yyyy)

    // === status e localização ===
    String status,           // status inicial (mantém compatível com a coluna existente)
    String currentLocation,  // localização atual (Interno, Externo, etc)
    String remarks,          // observações gerais

    // === upload fictício ===
    String uploadHash        // hash de upload (fictícia por enquanto)
) {}
