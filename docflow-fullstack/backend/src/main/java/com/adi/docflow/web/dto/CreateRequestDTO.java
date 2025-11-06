package com.adi.docflow.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * DTO usado para criação de novas solicitações (Requests).
 * 
 * Contém as referências a projeto, organizações, usuário solicitante e
 * informações complementares como propósito, datas e instruções especiais.
 */
public class CreateRequestDTO {

    // =============================
    // ENTIDADES PRINCIPAIS
    // =============================

    private Long projectId;        // ID do projeto associado
    private Long requesterOrgId;   // Organização solicitante (origem)
    private Long targetOrgId;      // Organização destinatária (destino)

    private Long requesterUserId;  // Usuário solicitante (opcional, mas preferido)

    // =============================
    // DETALHES DA SOLICITAÇÃO
    // =============================

    private String purpose;            // Propósito (Aprovação, Entrega, Revisão, etc.)
    private String description;        // Descrição textual

    private String requesterName;      // Nome do solicitante (fallback)
    private String requesterContact;   // E-mail do solicitante (ou outro contato)

    private String targetName;         // Nome do destinatário
    private String targetContact;      // Contato do destinatário

    private OffsetDateTime requestDate;     // Data da solicitação
    private OffsetDateTime desiredDeadline; // Prazo desejado

    private String justification;          // Justificativa (texto livre)
    private String specialInstructions;    // Instruções especiais

    private List<Long> documentIds;        // IDs dos documentos vinculados

    // =============================
    // CONSTRUTORES
    // =============================

    public CreateRequestDTO() {}

    // =============================
    // GETTERS / SETTERS
    // =============================

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getRequesterOrgId() {
        return requesterOrgId;
    }

    public void setRequesterOrgId(Long requesterOrgId) {
        this.requesterOrgId = requesterOrgId;
    }

    public Long getTargetOrgId() {
        return targetOrgId;
    }

    public void setTargetOrgId(Long targetOrgId) {
        this.targetOrgId = targetOrgId;
    }

    public Long getRequesterUserId() {
        return requesterUserId;
    }

    public void setRequesterUserId(Long requesterUserId) {
        this.requesterUserId = requesterUserId;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public String getRequesterContact() {
        return requesterContact;
    }

    public void setRequesterContact(String requesterContact) {
        this.requesterContact = requesterContact;
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }

    public String getTargetContact() {
        return targetContact;
    }

    public void setTargetContact(String targetContact) {
        this.targetContact = targetContact;
    }

    public OffsetDateTime getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(OffsetDateTime requestDate) {
        this.requestDate = requestDate;
    }

    public OffsetDateTime getDesiredDeadline() {
        return desiredDeadline;
    }

    public void setDesiredDeadline(OffsetDateTime desiredDeadline) {
        this.desiredDeadline = desiredDeadline;
    }

    public String getJustification() {
        return justification;
    }

    public void setJustification(String justification) {
        this.justification = justification;
    }

    public String getSpecialInstructions() {
        return specialInstructions;
    }

    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }

    public List<Long> getDocumentIds() {
        return documentIds;
    }

    public void setDocumentIds(List<Long> documentIds) {
        this.documentIds = documentIds;
    }
}
