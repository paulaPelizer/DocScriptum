package com.adi.docflow.service;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Project;
import com.adi.docflow.model.Request;
import com.adi.docflow.model.RequestDocument;
import com.adi.docflow.model.RequestStatus;

import com.adi.docflow.repository.*;

import com.adi.docflow.web.dto.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final ProjectLookupRepository projectLookupRepository;
    private final DisciplineLookupRepository disciplineLookupRepository;
    private final DocTypeLookupRepository docTypeLookupRepository;
    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;

    private final RequestDocumentRepository requestDocumentRepository;
    private final RequestRepository requestRepository;

    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");


    /**
     * Retorna os dados do formulário de Novo Documento
     */
    public DocumentFormDataDTO getFormData(Long projectId) {
        if (projectId == null)
            throw new IllegalArgumentException("projectId é obrigatório");

        // 🔹 Projects
        List<ProjectSummaryDTO> projects = projectLookupRepository.findAllSummaries()
                .stream()
                .map(v -> new ProjectSummaryDTO(v.getId(), v.getCode(), v.getName()))
                .toList();

        // 🔹 **Disciplinas — CORRIGIDO PARA O NOVO DisciplineDTO**
        List<DisciplineDTO> disciplines = disciplineLookupRepository.findAllAsView(projectId)
                .stream()
                .map(v -> new DisciplineDTO(
        v.getId(),
        v.getName(),
        "",            // cliente
        "",            // interno
        List.of()
))
                .toList();

        // 🔹 DocTypes
        List<DocTypeDTO> docTypes = docTypeLookupRepository.findAllAsView(projectId)
                .stream()
                .map(v -> new DocTypeDTO(
                        v.getId(),
                        v.getCode(),
                        v.getName(),
                        v.getDisciplineId()
                ))
                .toList();

        // 🔹 mocks
        List<SimpleIdNameDTO> responsibles = List.of(
                new SimpleIdNameDTO(1L, "Eng. João Silva"),
                new SimpleIdNameDTO(2L, "Arq. Paula Almeida")
        );
        List<SimpleIdNameDTO> clients = List.of(
                new SimpleIdNameDTO(10L, "Cliente — Construtora XYZ")
        );
        List<SimpleIdNameDTO> suppliers = List.of(
                new SimpleIdNameDTO(20L, "Fornecedor — Empresa ABC")
        );

        return new DocumentFormDataDTO(
                projects,
                disciplines,
                docTypes,
                responsibles,
                clients,
                suppliers
        );
    }


    /**
     * Criação de documento — permanece igual
     */
    public Document createDocument(CreateDocumentDTO dto) {
        if (dto == null)
            throw new IllegalArgumentException("DTO não pode ser nulo.");
        if (dto.projectId() == null)
            throw new IllegalArgumentException("projectId é obrigatório.");
        if (isBlank(dto.code()))
            throw new IllegalArgumentException("code é obrigatório.");
        if (isBlank(dto.title()))
            throw new IllegalArgumentException("title é obrigatório.");

        Project projectRef = projectRepository.getReferenceById(dto.projectId());

        Document doc = new Document();
        doc.setProject(projectRef);

        applyDtoToEntity(dto, doc);

        if (doc.getEditCount() == null)
            doc.setEditCount(0);

        if (isBlank(doc.getUploadHash()))
            doc.setUploadHash(UUID.randomUUID().toString().replace("-", "") + "_0");

        return documentRepository.save(doc);
    }


    /**
     * Atualização — permanece igual
     */
    public Document updateDocument(Long id, CreateDocumentDTO dto) {

        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + id));

        String baseHash = extractBaseHash(doc.getUploadHash());

        if (dto.projectId() != null &&
                !dto.projectId().equals(doc.getProject() != null ? doc.getProject().getId() : null)) {
            Project projectRef = projectRepository.getReferenceById(dto.projectId());
            doc.setProject(projectRef);
        }

        applyDtoToEntity(dto, doc);

        int nextEdit = (doc.getEditCount() != null ? doc.getEditCount() : 0) + 1;
        doc.setEditCount(nextEdit);

        if (!isBlank(baseHash))
            doc.setUploadHash(baseHash + "_" + nextEdit);

        doc.setUpdatedAt(java.time.Instant.now());

        Document saved = documentRepository.save(doc);

        syncRequestDocumentSnapshot(saved);
        propagateDocumentUpdateToRequests(saved.getId());

        return saved;
    }


    // ------------------------------------------------------------
    // Helpers (mantidos)
    // ------------------------------------------------------------

    private void applyDtoToEntity(CreateDocumentDTO dto, Document doc) {
        if (dto.clientId() != null)         doc.setClientId(dto.clientId());
        if (dto.disciplineId() != null)     doc.setDisciplineId(dto.disciplineId());
        if (dto.documentTypeId() != null)   doc.setDocumentTypeId(dto.documentTypeId());

        if (!isBlank(dto.code()))           doc.setCode(dto.code().trim().toUpperCase());
        if (!isBlank(dto.title()))          doc.setTitle(dto.title().trim());
        if (!isBlank(dto.revision()))       doc.setRevision(dto.revision().trim());
        if (!isBlank(dto.format()))         doc.setFormat(dto.format().trim());
        if (dto.pages() != null)            doc.setPages(dto.pages());
        if (!isBlank(dto.fileUrl()))        doc.setFileUrl(dto.fileUrl().trim());

        if (!isBlank(dto.status()))         doc.setStatus(dto.status().trim());
        else if (doc.getStatus() == null)   doc.setStatus("PLANNED");

        if (!isBlank(dto.species()))        doc.setSpecies(dto.species().trim());
        if (!isBlank(dto.description()))    doc.setDescription(dto.description().trim());
        if (!isBlank(dto.layoutRef()))      doc.setLayoutRef(dto.layoutRef().trim());
        if (dto.templateId() != null)       doc.setTemplateId(dto.templateId());
        if (!isBlank(dto.technicalResponsible()))
            doc.setTechnicalResponsible(dto.technicalResponsible().trim());
        if (!isBlank(dto.currentLocation()))  doc.setCurrentLocation(dto.currentLocation().trim());
        if (!isBlank(dto.remarks()))          doc.setRemarks(dto.remarks().trim());

        if (!isBlank(dto.uploadHash()))       doc.setUploadHash(dto.uploadHash().trim());

        if (!isBlank(dto.performedDate())) doc.setPerformedDate(parseDate(dto.performedDate()));
        if (!isBlank(dto.dueDate()))       doc.setDueDate(parseDate(dto.dueDate()));
    }


    private void syncRequestDocumentSnapshot(Document doc) {
        List<RequestDocument> links = requestDocumentRepository.findByDocumentId(doc.getId());
        if (links.isEmpty()) return;

        for (RequestDocument rd : links) {
            rd.setDocUploadHash(doc.getUploadHash());
            rd.setDocEditCount(doc.getEditCount());
        }

        requestDocumentRepository.saveAll(links);
    }


    private void propagateDocumentUpdateToRequests(Long documentId) {
        List<RequestDocument> links = requestDocumentRepository.findByDocumentId(documentId);
        if (links.isEmpty()) return;

        OffsetDateTime now = OffsetDateTime.now();

        for (RequestDocument rd : links) {
            Request r = rd.getRequest();
            if (r != null && r.getStatus() == RequestStatus.WAITING_CLIENT) {
                r.setStatus(RequestStatus.WAITING_ADM);
                r.setUpdatedAt(now);
                requestRepository.save(r);
            }
        }
    }


    private String extractBaseHash(String hash) {
        if (hash == null) return null;
        int idx = hash.indexOf('_');
        if (idx <= 0) return hash;
        return hash.substring(0, idx);
    }

    private LocalDate parseDate(String s) {
        try {
            if (s == null || s.isBlank()) return null;
            return LocalDate.parse(s, BR);
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
