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

    // novos: para achar Requests ligadas ao documento
    private final RequestDocumentRepository requestDocumentRepository;
    private final RequestRepository requestRepository;

    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Monta os dados da tela "Novo Documento" filtrando por projeto.
     * @param projectId ID do projeto (obrigatório)
     */
    public DocumentFormDataDTO getFormData(Long projectId) {
        if (projectId == null) {
            throw new IllegalArgumentException("projectId é obrigatório");
        }

        // Projects (read-model leve)
        List<ProjectSummaryDTO> projects = projectLookupRepository.findAllSummaries().stream()
                .map(v -> new ProjectSummaryDTO(v.getId(), v.getCode(), v.getName()))
                .collect(Collectors.toList());

        // Disciplines do projeto
        List<DisciplineDTO> disciplines = disciplineLookupRepository.findAllAsView(projectId).stream()
                .map(v -> DisciplineDTO.builder()
                        .id(v.getId())
                        .code(v.getCode())
                        .name(v.getName())
                        .build())
                .toList();

        // Doc types/formatos do projeto
        List<DocTypeDTO> docTypes = docTypeLookupRepository.findAllAsView(projectId).stream()
                .map(v -> DocTypeDTO.builder()
                        .id(v.getId())
                        .code(v.getCode())
                        .name(v.getName())
                        .disciplineId(v.getDisciplineId())
                        .build())
                .toList();

        // Mocks temporários até termos recursos/partes e vínculos reais
        List<SimpleIdNameDTO> responsibles = List.of(
                SimpleIdNameDTO.builder().id(1L).name("Eng. João Silva").build(),
                SimpleIdNameDTO.builder().id(2L).name("Arq. Paula Almeida").build()
        );
        List<SimpleIdNameDTO> clients = List.of(
                SimpleIdNameDTO.builder().id(10L).name("Cliente — Construtora XYZ").build()
        );
        List<SimpleIdNameDTO> suppliers = List.of(
                SimpleIdNameDTO.builder().id(20L).name("Fornecedor — Empresa ABC").build()
        );

        return DocumentFormDataDTO.builder()
                .projects(projects)
                .disciplines(disciplines)
                .docTypes(docTypes)
                .responsibles(responsibles)
                .clients(clients)
                .suppliers(suppliers)
                .build();
    }

    /**
     * Cria e salva um novo documento no banco a partir do formulário.
     * Mapeia todos os campos do CreateDocumentDTO → Document.
     */
    public Document createDocument(CreateDocumentDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("DTO não pode ser nulo.");
        }
        if (dto.projectId() == null) {
            throw new IllegalArgumentException("projectId é obrigatório.");
        }
        if (isBlank(dto.code())) {
            throw new IllegalArgumentException("code é obrigatório.");
        }
        if (isBlank(dto.title())) {
            throw new IllegalArgumentException("title é obrigatório.");
        }

        // Referência JPA pelo ID (sem precisar setar name/code)
        Project projectRef = projectRepository.getReferenceById(dto.projectId());

        Document doc = new Document();
        doc.setProject(projectRef);

        // aplica TODOS os campos do DTO, com normalizações seguras
        applyDtoToEntity(dto, doc);

        // garante edit_count inicial
        if (doc.getEditCount() == null) {
            doc.setEditCount(0);
        }

        // se não veio hash, gera um base
        if (isBlank(doc.getUploadHash())) {
            String base = UUID.randomUUID().toString().replace("-", "");
            doc.setUploadHash(base + "_0");
        }

        return documentRepository.save(doc);
    }

    /**
     * Atualiza parcialmente um documento existente.
     * Também propaga a nova hash/edit_count para request_document
     * e atualiza o status das Requests ligadas (WAITING_CLIENT → WAITING_ADM).
     */
    public Document updateDocument(Long id, CreateDocumentDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("DTO não pode ser nulo.");
        }

        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + id));

        // Guarda a hash atual para extrair o "base"
        String currentHash = doc.getUploadHash();
        String baseHash = !isBlank(currentHash) ? extractBaseHash(currentHash) : null;

        // Troca de projeto, se necessário
        if (dto.projectId() != null &&
                !dto.projectId().equals(doc.getProject() != null ? doc.getProject().getId() : null)) {
            Project projectRef = projectRepository.getReferenceById(dto.projectId());
            doc.setProject(projectRef);
        }

        // Aplica todos os demais campos
        applyDtoToEntity(dto, doc);

        // Incrementa contador de edições
        Integer current = doc.getEditCount();
        if (current == null) current = 0;
        int nextEdit = current + 1;
        doc.setEditCount(nextEdit);

        // Atualiza a hash mantendo a parte base
        if (!isBlank(baseHash)) {
            doc.setUploadHash(baseHash + "_" + nextEdit);
        } else if (!isBlank(doc.getUploadHash())) {
            // se por algum motivo não tinha baseHash, extrai da atual
            String base = extractBaseHash(doc.getUploadHash());
            doc.setUploadHash(base + "_" + nextEdit);
        }

        // Atualiza timestamp
        doc.setUpdatedAt(java.time.Instant.now());

        // Salva o documento
        Document saved = documentRepository.save(doc);

        // 🔹 Atualiza o snapshot na request_document
        syncRequestDocumentSnapshot(saved);

        // 🔹 Atualiza o status das Requests ligadas (WAITING_CLIENT → WAITING_ADM)
        propagateDocumentUpdateToRequests(saved.getId());

        return saved;
    }

    // ------------------------- Helpers -------------------------

    /**
     * Converte e aplica campos do DTO na entidade Document,
     * com trims/normalizações sem alterar semântica existente.
     */
    private void applyDtoToEntity(CreateDocumentDTO dto, Document doc) {
        // IDs auxiliares
        if (dto.clientId() != null)         doc.setClientId(dto.clientId());
        if (dto.disciplineId() != null)     doc.setDisciplineId(dto.disciplineId());
        if (dto.documentTypeId() != null)   doc.setDocumentTypeId(dto.documentTypeId());

        // Dados do documento
        if (!isBlank(dto.code()))           doc.setCode(dto.code().trim().toUpperCase());
        if (!isBlank(dto.title()))          doc.setTitle(dto.title().trim());
        if (!isBlank(dto.revision()))       doc.setRevision(dto.revision().trim());
        if (!isBlank(dto.format()))         doc.setFormat(dto.format().trim());
        if (dto.pages() != null)            doc.setPages(dto.pages());
        if (!isBlank(dto.fileUrl()))        doc.setFileUrl(dto.fileUrl().trim());

        // Status
        if (!isBlank(dto.status())) {
            doc.setStatus(dto.status().trim());
        } else if (doc.getStatus() == null) {
            doc.setStatus("PLANNED");
        }

        // Descritivos
        if (!isBlank(dto.species()))                 doc.setSpecies(dto.species().trim());
        if (!isBlank(dto.description()))             doc.setDescription(dto.description().trim());
        if (!isBlank(dto.layoutRef()))               doc.setLayoutRef(dto.layoutRef().trim());
        if (dto.templateId() != null)                doc.setTemplateId(dto.templateId());
        if (!isBlank(dto.technicalResponsible()))    doc.setTechnicalResponsible(dto.technicalResponsible().trim());
        if (!isBlank(dto.currentLocation()))         doc.setCurrentLocation(dto.currentLocation().trim());
        if (!isBlank(dto.remarks()))                 doc.setRemarks(dto.remarks().trim());

        // uploadHash: sempre que vier alguma coisa, atualiza
        if (!isBlank(dto.uploadHash()))              doc.setUploadHash(dto.uploadHash().trim());

        // Datas
        if (!isBlank(dto.performedDate())) doc.setPerformedDate(parseDate(dto.performedDate()));
        if (!isBlank(dto.dueDate()))       doc.setDueDate(parseDate(dto.dueDate()));
    }

    /**
     * Atualiza os campos de snapshot em request_document
     * (doc_upload_hash, doc_edit_count) com base no Document salvo.
     */
    private void syncRequestDocumentSnapshot(Document doc) {
        if (doc.getId() == null) return;

        List<RequestDocument> links = requestDocumentRepository.findByDocumentId(doc.getId());
        if (links.isEmpty()) return;

        for (RequestDocument rd : links) {
            rd.setDocUploadHash(doc.getUploadHash());
            rd.setDocEditCount(doc.getEditCount());
        }
        requestDocumentRepository.saveAll(links);
    }

    /**
     * Atualiza Requests ligadas ao documento:
     * se estiverem em WAITING_CLIENT, vão para WAITING_ADM.
     */
    private void propagateDocumentUpdateToRequests(Long documentId) {
        List<RequestDocument> links = requestDocumentRepository.findByDocumentId(documentId);
        if (links.isEmpty()) return;

        OffsetDateTime now = OffsetDateTime.now();

        for (RequestDocument rd : links) {
            Request r = rd.getRequest();
            if (r == null) continue;

            if (r.getStatus() == RequestStatus.WAITING_CLIENT) {
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

    // Utilitário para converter datas opcionais
    private LocalDate parseDate(String s) {
        try {
            if (s == null || s.isBlank()) return null;
            return LocalDate.parse(s, BR);
        } catch (Exception e) {
            // mantém nulo silenciosamente (mesma filosofia já adotada)
            return null;
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
