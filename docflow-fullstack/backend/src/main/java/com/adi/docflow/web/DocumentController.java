package com.adi.docflow.web;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Project;
import com.adi.docflow.model.Request;
import com.adi.docflow.model.RequestDocument;
import com.adi.docflow.model.RequestStatus;

import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.ProjectRepository;
import com.adi.docflow.repository.ProjectLookupRepository;
import com.adi.docflow.repository.DocTypeLookupRepository;
import com.adi.docflow.repository.DisciplineLookupRepository;
import com.adi.docflow.repository.RequestDocumentRepository;
import com.adi.docflow.repository.RequestRepository;

import com.adi.docflow.service.DocumentService;
import com.adi.docflow.web.dto.*;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/v1")
public class DocumentController {

    private final DocumentRepository docRepo;
    private final ProjectRepository projectRepo;
    private final ProjectLookupRepository projectLookupRepo;
    private final DocTypeLookupRepository docTypeLookupRepo;
    private final DisciplineLookupRepository disciplineLookupRepo;
    private final DocumentService documentService;
    private final RequestDocumentRepository reqDocRepo;
    private final RequestRepository requestRepo;

    public DocumentController(
            DocumentRepository docRepo,
            ProjectRepository projectRepo,
            ProjectLookupRepository projectLookupRepo,
            DisciplineLookupRepository disciplineLookupRepo,
            DocTypeLookupRepository docTypeLookupRepo,
            DocumentService documentService,
            RequestDocumentRepository reqDocRepo,
            RequestRepository requestRepo
    ) {
        this.docRepo = docRepo;
        this.projectRepo = projectRepo;
        this.projectLookupRepo = projectLookupRepo;
        this.disciplineLookupRepo = disciplineLookupRepo;
        this.docTypeLookupRepo = docTypeLookupRepo;
        this.documentService = documentService;
        this.reqDocRepo = reqDocRepo;
        this.requestRepo = requestRepo;
    }

    // ============================ LISTAGEM ============================
    @GetMapping("/documents")
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<DocumentListItemDTO> listDocuments(
            @RequestParam(value = "projectId", required = false) Long projectId,
            @RequestParam(value = "clientId", required = false) Long clientId,
            @RequestParam(value = "disciplineId", required = false) Long disciplineId,
            @RequestParam(value = "documentTypeId", required = false) Long documentTypeId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "20") Integer size,
            @RequestParam(value = "sort", defaultValue = "updatedAt,desc") String sort
    ) {
        Pageable pageable = buildPageable(page, size, sort);
        Specification<Document> spec = buildSpec(projectId, clientId, disciplineId, documentTypeId, status, location, q);
        return docRepo.findAll(spec, pageable).map(this::toListItem);
    }

    @GetMapping("/projects/{projectId}/documents")
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<DocumentListItemDTO> listByProject(
            @PathVariable Long projectId,
            @RequestParam(value = "clientId", required = false) Long clientId,
            @RequestParam(value = "disciplineId", required = false) Long disciplineId,
            @RequestParam(value = "documentTypeId", required = false) Long documentTypeId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "20") Integer size,
            @RequestParam(value = "sort", defaultValue = "updatedAt,desc") String sort
    ) {
        Pageable pageable = buildPageable(page, size, sort);
        Specification<Document> spec = buildSpec(projectId, clientId, disciplineId, documentTypeId, status, location, q);
        return docRepo.findAll(spec, pageable).map(this::toListItem);
    }

    // ============================== DETALHE (ID) ==============================
    @GetMapping("/documents/{id}")
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<DocumentDetailDTO> getById(@PathVariable Long id) {
        Document doc = docRepo.findByIdWithProject(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Documento não encontrado"));

        ProjectSummaryDTO project = (doc.getProject() == null)
                ? null
                : new ProjectSummaryDTO(
                doc.getProject().getId(),
                doc.getProject().getCode(),
                doc.getProject().getName()
        );

        String nameForDto = doc.getTitle(); // fallback para "name"

        DocumentDetailDTO dto = new DocumentDetailDTO(
                doc.getId(),
                doc.getCode(),
                doc.getTitle(),
                nameForDto,
                doc.getRevision(),
                doc.getFormat(),
                doc.getCurrentLocation(),
                doc.getStatus(),
                toIsoString(doc.getUpdatedAt()),
                doc.getDescription(),
                doc.getFileUrl(),
                doc.getPages(),
                toIsoString(doc.getPerformedDate()),
                toIsoString(doc.getDueDate()),
                doc.getTechnicalResponsible(),
                project
        );

        return ResponseEntity.ok(dto);
    }

    // ============================== DETALHE (HASH OU ID) ==============================
    @GetMapping("/documents/by-hash/{hash}")
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<DocumentDetailDTO> getByHash(@PathVariable String hash) {
        if (hash == null || hash.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "hash é obrigatória");
        }

        // 1) tenta pelo uploadHash
        Document doc = null;
        try {
            doc = docRepo.findByUploadHash(hash);
        } catch (Exception ignore) {}

        // 2) fallback: se não achou por hash, tenta tratar como ID (aceita "id-59" ou "59")
        if (doc == null) {
            String candidate = hash.trim();
            if (candidate.toLowerCase().startsWith("id-")) {
                candidate = candidate.substring(3);
            }
            try {
                Long id = Long.valueOf(candidate);
                doc = docRepo.findByIdWithProject(id).orElse(null);
            } catch (NumberFormatException ignore) {
                // não é um número -> segue sem doc
            }
        }

        if (doc == null) {
            throw new ResponseStatusException(NOT_FOUND, "Documento não encontrado pela hash");
        }

        ProjectSummaryDTO project = (doc.getProject() == null)
                ? null
                : new ProjectSummaryDTO(
                doc.getProject().getId(),
                doc.getProject().getCode(),
                doc.getProject().getName()
        );

        String nameForDto = doc.getTitle();

        DocumentDetailDTO dto = new DocumentDetailDTO(
                doc.getId(),
                doc.getCode(),
                doc.getTitle(),
                nameForDto,
                doc.getRevision(),
                doc.getFormat(),
                doc.getCurrentLocation(),
                doc.getStatus(),
                toIsoString(doc.getUpdatedAt()),
                doc.getDescription(),
                doc.getFileUrl(),
                doc.getPages(),
                toIsoString(doc.getPerformedDate()),
                toIsoString(doc.getDueDate()),
                doc.getTechnicalResponsible(),
                project
        );

        return ResponseEntity.ok(dto);
    }

    // ============================ FORM-DATA ============================
    @GetMapping("/documents/form-data")
    public ResponseEntity<DocumentFormDataDTO> getFormData(@RequestParam("projectId") Long projectId) {
        if (projectId == null) throw new ResponseStatusException(BAD_REQUEST, "projectId é obrigatório");

        projectRepo.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Projeto não encontrado"));

        var projects = projectLookupRepo.findAllSummaries().stream()
                .map(v -> new ProjectSummaryDTO(v.getId(), v.getCode(), v.getName()))
                .collect(Collectors.toList());

       var disciplines = disciplineLookupRepo.findAllAsView(projectId).stream()
        .map(v -> new DisciplineDTO(
                v.getId(),         // ou v.getDisciplineId(), se for esse o nome
                v.getName(),       // nome da disciplina
                null,              // destinatarioCliente (aqui não usamos ainda)
                null,              // destinatarioInterno
                List.of()          // lista de tipos vazia no form
        ))
        .collect(Collectors.toList());


        var docTypes = docTypeLookupRepo.findAllAsView(projectId).stream()
                .map(v -> new DocTypeDTO(v.getId(), v.getCode(), v.getName(), v.getDisciplineId()))
                .collect(Collectors.toList());

        var responsibles = Arrays.asList(
                new SimpleIdNameDTO(1L, "Eng. João Silva"),
                new SimpleIdNameDTO(2L, "Arq. Paula Almeida")
        );
        var clients   = Collections.singletonList(new SimpleIdNameDTO(10L, "Cliente — Construtora XYZ"));
        var suppliers = Collections.singletonList(new SimpleIdNameDTO(20L, "Fornecedor — Empresa ABC"));

        var dto = DocumentFormDataDTO.builder()
                .projects(projects)
                .disciplines(disciplines)
                .docTypes(docTypes)
                .responsibles(responsibles)
                .clients(clients)
                .suppliers(suppliers)
                .build();

        return ResponseEntity.ok(dto);
    }

    // ============================== CREATE ==============================
    @PostMapping("/documents")
    @Transactional
    public ResponseEntity<?> create(@RequestBody CreateDocumentDTO dto) {
        if (dto == null) throw new ResponseStatusException(BAD_REQUEST, "payload obrigatório");
        if (dto.projectId() == null) throw new ResponseStatusException(BAD_REQUEST, "projectId é obrigatório");
        if (dto.code() == null || dto.code().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "code é obrigatório");
        if (dto.title() == null || dto.title().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "title é obrigatório");

        Project project = projectRepo.findById(dto.projectId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Projeto não encontrado"));

        Document saved = documentService.createDocument(dto);
        project.setUpdatedAt(Instant.now());
        projectRepo.save(project);

        return ResponseEntity.created(URI.create("/api/v1/documents/" + saved.getId()))
                .body(saved.getId());
    }

    // ============================== UPDATE ==============================
    @PutMapping("/documents/{id}")
    @Transactional
    public ResponseEntity<Void> update(@PathVariable Long id, @RequestBody CreateDocumentDTO dto) {
        Document doc = docRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Documento não encontrado"));

        // Guarda hash anterior pra ver se a versão mudou
        String oldHash = doc.getUploadHash();

        // ---- campos básicos ----
        if (dto.projectId() != null) {
            Project project = projectRepo.findById(dto.projectId())
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Projeto não encontrado"));
            doc.setProject(project);
        }
        if (dto.code() != null) doc.setCode(dto.code());
        if (dto.title() != null) doc.setTitle(dto.title());
        if (dto.revision() != null) doc.setRevision(dto.revision());
        if (dto.format() != null) doc.setFormat(dto.format());
        if (dto.currentLocation() != null) doc.setCurrentLocation(dto.currentLocation());
        if (dto.status() != null) doc.setStatus(dto.status());
        if (dto.description() != null) doc.setDescription(dto.description());
        if (dto.fileUrl() != null) doc.setFileUrl(dto.fileUrl());
        if (dto.pages() != null) doc.setPages(dto.pages());
        if (dto.technicalResponsible() != null) doc.setTechnicalResponsible(dto.technicalResponsible());
        // se quiser depois, dá pra converter performedDate/dueDate aqui também

        // ---- upload_hash / edit_count ----
        String currentHash = doc.getUploadHash();
        Integer currentEdit = doc.getEditCount();
        if (currentEdit == null) currentEdit = 0;

        String baseHash = null;

        if (currentHash != null && !currentHash.isBlank()) {
            // Já existe hash → base é o valor sem o sufixo "_n" (se existir)
            String tmp = currentHash.trim();
            int idx = tmp.lastIndexOf('_');
            if (idx > 0) {
                String suffix = tmp.substring(idx + 1);
                boolean numeric = suffix.chars().allMatch(Character::isDigit);
                baseHash = numeric ? tmp.substring(0, idx) : tmp;
            } else {
                baseHash = tmp;
            }
        } else if (dto.uploadHash() != null && !dto.uploadHash().isBlank()) {
            // Caso inicial: estava sem hash no banco, mas veio uma no DTO
            baseHash = dto.uploadHash().trim();
            currentEdit = 0;
        }

        if (baseHash != null && !baseHash.isBlank()) {
            int nextEdit = currentEdit + 1;
            doc.setEditCount(nextEdit);
            doc.setUploadHash(baseHash + "_" + nextEdit);
        }

        doc.setUpdatedAt(Instant.now());
        docRepo.save(doc);

        // ---- se a hash mudou -> atualizar Requests WAITING_CLIENT -> WAITING_ADM ----
        String newHash = doc.getUploadHash();
        boolean versionChanged =
                (oldHash == null && newHash != null) ||
                (oldHash != null && !oldHash.equals(newHash));

        if (versionChanged) {
            OffsetDateTime now = OffsetDateTime.now();
            List<RequestDocument> links = reqDocRepo.findByDocumentId(doc.getId());

            for (RequestDocument rd : links) {
                Request req = rd.getRequest();
                if (req != null && req.getStatus() == RequestStatus.WAITING_CLIENT) {
                    req.setStatus(RequestStatus.WAITING_ADM);
                    req.setUpdatedAt(now);
                    requestRepo.save(req);
                }
            }
        }

        return ResponseEntity.noContent().build();
    }

    // ============================== IMPORT ==============================
    @PostMapping("/documents/import")
    @Transactional
    public ResponseEntity<ImportReportDTO> importBatch(@RequestBody List<ImportDocumentDTO> payload) {
        if (payload == null || payload.isEmpty()) return ResponseEntity.badRequest().build();

        final List<ImportReportDTO.RowError> errors = new ArrayList<>();
        final List<Document> toPersist = new ArrayList<>();

        final Set<Long> projectIds = payload.stream()
                .map(ImportDocumentDTO::projectId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        final Map<Long, Project> projectById = projectRepo.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, p -> p));

        for (int idx = 0; idx < payload.size(); idx++) {
            ImportDocumentDTO row = payload.get(idx);
            Long pid = row.projectId();
            String code = row.code();
            String title = row.title();
            String revStr = row.revision() == null ? null : String.valueOf(row.revision()).trim();

            if (pid == null) {
                errors.add(new ImportReportDTO.RowError(idx, null, code, row.revision(), "projectId é obrigatório"));
                continue;
            }
            if (code == null || code.isBlank()) {
                errors.add(new ImportReportDTO.RowError(idx, pid, null, row.revision(), "code é obrigatório"));
                continue;
            }
            if (title == null || title.isBlank()) {
                errors.add(new ImportReportDTO.RowError(idx, pid, code, row.revision(), "title é obrigatório"));
                continue;
            }
            if (!projectById.containsKey(pid)) {
                errors.add(new ImportReportDTO.RowError(idx, pid, code, row.revision(), "projectId não existe"));
                continue;
            }

            Document d = new Document();
            d.setProject(projectById.get(pid));
            d.setCode(code.trim().toUpperCase(Locale.ROOT));
            d.setTitle(title.trim());
            d.setRevision((revStr == null || revStr.isBlank()) ? "1" : revStr);

            toPersist.add(d);
        }

        if (!toPersist.isEmpty()) {
            docRepo.saveAll(toPersist);

            Set<Long> touched = toPersist.stream()
                    .map(doc -> doc.getProject().getId())
                    .collect(Collectors.toSet());
            for (Long pid : touched) {
                Project p = projectById.get(pid);
                if (p != null) p.setUpdatedAt(Instant.now());
            }
            projectRepo.saveAll(projectById.values());
        }

        ImportReportDTO report = new ImportReportDTO(
                payload.size(),
                toPersist.size(),
                payload.size() - toPersist.size(),
                errors
        );
        return ResponseEntity.ok(report);
    }

    // ============================== HELPERS ==============================
    private Specification<Document> buildSpec(Long projectId, Long clientId, Long disciplineId,
                                              Long documentTypeId, String status, String location, String q) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> preds = new ArrayList<>();

            if (projectId != null) preds.add(cb.equal(root.join("project").get("id"), projectId));
            if (clientId != null) preds.add(cb.equal(root.get("clientId"), clientId));
            if (disciplineId != null) preds.add(cb.equal(root.get("disciplineId"), disciplineId));
            if (documentTypeId != null) preds.add(cb.equal(root.get("documentTypeId"), documentTypeId));
            if (status != null && !status.isBlank())
                preds.add(cb.equal(cb.lower(root.get("status")), status.toLowerCase()));
            if (location != null && !location.isBlank())
                preds.add(cb.equal(cb.lower(root.get("currentLocation")), location.toLowerCase()));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase().trim() + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("code")), like),
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.join("project").get("name")), like)
                ));
            }
            return cb.and(preds.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private Pageable buildPageable(Integer page, Integer size, String sort) {
        int p = (page == null || page < 0) ? 0 : page;
        int s = (size == null || size < 1) ? 20 : size;
        int max = 200;
        if (s > max) s = max;
        Sort sortObj = parseSortMulti(sort);
        return PageRequest.of(p, s, sortObj);
    }

    private Sort parseSortMulti(String sort) {
        if (sort == null || sort.isBlank()) return Sort.by(Sort.Order.desc("updatedAt"));
        String[] parts = sort.split(";");
        List<Sort.Order> orders = new ArrayList<>();
        for (String part : parts) {
            String[] kv = part.trim().split(",", 2);
            String field = kv[0].trim();
            String dir = (kv.length > 1 ? kv[1].trim() : "desc");
            orders.add("asc".equalsIgnoreCase(dir) ? Sort.Order.asc(field) : Sort.Order.desc(field));
        }
        if (orders.isEmpty()) orders.add(Sort.Order.desc("updatedAt"));
        return Sort.by(orders);
    }

    private DocumentListItemDTO toListItem(Document d) {
        Long projId = (d.getProject() != null ? d.getProject().getId() : null);
        String projName = (d.getProject() != null ? d.getProject().getName() : null);
        return new DocumentListItemDTO(
                d.getId(), d.getCode(), d.getTitle(), d.getRevision(),
                d.getFormat(), d.getCurrentLocation(), d.getStatus(),
                d.getUpdatedAt(), projId, projName, d.getUploadHash()
        );
    }

    /** Converte qualquer tipo temporal comum para String ISO-8601 (ou null). */
    private String toIsoString(Object temporal) {
        if (temporal == null) return null;
        try {
            if (temporal instanceof java.time.Instant i) {
                return java.time.OffsetDateTime.ofInstant(i, java.time.ZoneOffset.UTC).toString();
            }
            if (temporal instanceof java.time.OffsetDateTime odt) {
                return odt.toString();
            }
            if (temporal instanceof java.time.LocalDateTime ldt) {
                return ldt.atOffset(java.time.ZoneOffset.UTC).toString();
            }
            if (temporal instanceof java.util.Date d) {
                return java.time.OffsetDateTime.ofInstant(d.toInstant(), java.time.ZoneOffset.UTC).toString();
            }
            if (temporal instanceof String s) return s;
        } catch (Exception ignore) {}
        return temporal.toString();
    }
}
