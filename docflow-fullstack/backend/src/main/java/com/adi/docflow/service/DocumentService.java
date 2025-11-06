package com.adi.docflow.service;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Project;
import com.adi.docflow.repository.*;
import com.adi.docflow.web.dto.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final ProjectLookupRepository projectLookupRepository;
    private final DisciplineLookupRepository disciplineLookupRepository;
    private final DocTypeLookupRepository docTypeLookupRepository;
    private final DocumentRepository documentRepository;   // já existia
    private final ProjectRepository projectRepository;     // já existia

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

        return documentRepository.save(doc);
    }

    /**
     * (Opcional/futuro) Atualiza parcialmente um documento existente.
     * Não é chamado pelos endpoints atuais — mantém compatibilidade.
     */
    public Document updateDocument(Long id, CreateDocumentDTO dto) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Documento não encontrado: " + id));

        if (dto.projectId() != null) {
            Project projectRef = projectRepository.getReferenceById(dto.projectId());
            doc.setProject(projectRef);
        }

        applyDtoToEntity(dto, doc);
        return documentRepository.save(doc);
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

        // Status (mantém default atual "PLANNED" se não vier nada)
        if (!isBlank(dto.status())) {
            doc.setStatus(dto.status().trim());
        } else if (doc.getStatus() == null) {
            doc.setStatus("PLANNED");
        }

        // Campos descritivos e técnicos
        if (!isBlank(dto.species()))                 doc.setSpecies(dto.species().trim());
        if (!isBlank(dto.description()))             doc.setDescription(dto.description().trim());
        if (!isBlank(dto.layoutRef()))               doc.setLayoutRef(dto.layoutRef().trim());
        if (dto.templateId() != null)                doc.setTemplateId(dto.templateId());
        if (!isBlank(dto.technicalResponsible()))    doc.setTechnicalResponsible(dto.technicalResponsible().trim());
        if (!isBlank(dto.currentLocation()))         doc.setCurrentLocation(dto.currentLocation().trim());
        if (!isBlank(dto.remarks()))                 doc.setRemarks(dto.remarks().trim());
        if (!isBlank(dto.uploadHash()))              doc.setUploadHash(dto.uploadHash().trim());

        // Datas (dd/MM/yyyy)
        if (!isBlank(dto.performedDate())) doc.setPerformedDate(parseDate(dto.performedDate()));
        if (!isBlank(dto.dueDate()))       doc.setDueDate(parseDate(dto.dueDate()));
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
