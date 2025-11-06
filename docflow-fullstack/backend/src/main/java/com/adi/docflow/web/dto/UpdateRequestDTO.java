package com.adi.docflow.web.dto;

import com.adi.docflow.model.RequestStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO genérico de atualização parcial de Request.
 * Todos os campos são opcionais; só atualiza o que vier != null.
 */
public class UpdateRequestDTO {
    private Long projectId;
    private Long requesterOrgId;
    private Long targetOrgId;

    private Long requesterUserId;      // para resolver nome do solicitante, se vier
    private String requesterName;
    private String requesterContact;

    private String targetName;
    private String targetContact;

    private String purpose;
    private String description;

    private OffsetDateTime requestDate;
    private OffsetDateTime desiredDeadline;

    private String justification;
    private String specialInstructions;

    private RequestStatus status;      // opcional

    private List<Long> documentIds;    // vinculações (opcional)

    private String reason;             // motivo de alteração (ex.: rejeição)

    // -------- Getters/Setters --------
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public Long getRequesterOrgId() { return requesterOrgId; }
    public void setRequesterOrgId(Long requesterOrgId) { this.requesterOrgId = requesterOrgId; }

    public Long getTargetOrgId() { return targetOrgId; }
    public void setTargetOrgId(Long targetOrgId) { this.targetOrgId = targetOrgId; }

    public Long getRequesterUserId() { return requesterUserId; }
    public void setRequesterUserId(Long requesterUserId) { this.requesterUserId = requesterUserId; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getRequesterContact() { return requesterContact; }
    public void setRequesterContact(String requesterContact) { this.requesterContact = requesterContact; }

    public String getTargetName() { return targetName; }
    public void setTargetName(String targetName) { this.targetName = targetName; }

    public String getTargetContact() { return targetContact; }
    public void setTargetContact(String targetContact) { this.targetContact = targetContact; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public OffsetDateTime getRequestDate() { return requestDate; }
    public void setRequestDate(OffsetDateTime requestDate) { this.requestDate = requestDate; }

    public OffsetDateTime getDesiredDeadline() { return desiredDeadline; }
    public void setDesiredDeadline(OffsetDateTime desiredDeadline) { this.desiredDeadline = desiredDeadline; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public List<Long> getDocumentIds() { return documentIds; }
    public void setDocumentIds(List<Long> documentIds) { this.documentIds = documentIds; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
