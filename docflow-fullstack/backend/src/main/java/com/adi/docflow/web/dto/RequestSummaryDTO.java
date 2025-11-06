// src/main/java/com/adi/docflow/web/dto/RequestSummaryDTO.java
package com.adi.docflow.web.dto;

import com.adi.docflow.model.RequestStatus;
import java.time.OffsetDateTime;

public record RequestSummaryDTO(
    Long id,
    String number,
    Long projectId,
    String projectName,
    Long originId,
    String originName,
    Long targetId,
    String targetName,
    String purpose,
    Long documents,
    OffsetDateTime requestDate,
    RequestStatus status
) {}
