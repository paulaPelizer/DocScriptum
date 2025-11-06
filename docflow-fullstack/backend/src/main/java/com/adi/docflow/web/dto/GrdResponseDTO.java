// src/main/java/com/adi/docflow/web/dto/GrdResponseDTO.java
package com.adi.docflow.web.dto;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class GrdResponseDTO {
    // Request
    private Long requestId;
    private String requestNumber;
    private String requestProtocol;

    // Projeto
    private Long   projectId;
    private String projectCode;
    private String projectName;

    // Orgs
    private Long   originId;
    private String originName;
    private Long   destinationId;
    private String destinationName;

    // Identificadores GRD
    private Long   id;
    private String number;
    private String protocol;

    // Conteúdo
    private String purpose;
    private String deliveryMethod;
    private String observations;

    // Emissão/Status
    private String emittedBy;
    private OffsetDateTime emissionAt;
    private String emissionAtText;
    private String status;

    // Totais + lista de documentos
    private Integer totalDocuments;
    private Integer totalPages;
    private List<DocumentDTO> documents;   // <— nome minúsculo
}
