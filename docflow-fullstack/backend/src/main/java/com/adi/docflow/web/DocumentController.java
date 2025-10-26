package com.adi.docflow.web;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Project;
import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.ProjectRepository;
import com.adi.docflow.web.dto.CreateDocumentDTO;
import com.adi.docflow.web.dto.ImportDocumentDTO;
import com.adi.docflow.web.dto.ImportReportDTO;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.Locale;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentRepository docRepo;
    private final ProjectRepository projectRepo;

    public DocumentController(DocumentRepository docRepo, ProjectRepository projectRepo) {
        this.docRepo = docRepo;
        this.projectRepo = projectRepo;
    }

    // ============ POST simples (Novo Documento) ============
    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody CreateDocumentDTO dto) {
        if (dto == null) throw new ResponseStatusException(BAD_REQUEST, "payload obrigatório");
        if (dto.projectId() == null) throw new ResponseStatusException(BAD_REQUEST, "projectId é obrigatório");
        if (dto.code() == null || dto.code().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "code é obrigatório");
        if (dto.title() == null || dto.title().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "title é obrigatório");
        if (dto.revision() == null || dto.revision().isBlank()) throw new ResponseStatusException(BAD_REQUEST, "revision é obrigatório");

        Project project = projectRepo.findById(dto.projectId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Projeto não encontrado"));

        // normalizações básicas (sem verificação de duplicidade)
        final String codeKey = dto.code().trim().toUpperCase(Locale.ROOT);
        final String revKey  = dto.revision().trim();

        Document d = new Document();
        d.setProject(project);
        d.setCode(codeKey);              // salva normalizado (UPPER)
        d.setTitle(dto.title().trim());  // coluna "name"
        d.setRevision(revKey);           // String
        d.setFormat(dto.format());
        d.setPages(dto.pages());
        d.setFileUrl(dto.fileUrl());

        Document saved = docRepo.save(d);

        // atualiza updated_at do projeto
        project.setUpdatedAt(Instant.now());
        projectRepo.save(project);

        return ResponseEntity.created(URI.create("/api/v1/documents/" + saved.getId()))
                .body(saved.getId());
    }

    // ============ IMPORT em lote ============
    @PostMapping("/import")
    @Transactional
    public ResponseEntity<ImportReportDTO> importBatch(@RequestBody List<ImportDocumentDTO> payload) {
        if (payload == null || payload.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        final List<ImportReportDTO.RowError> errors = new ArrayList<>();
        final List<Document> toPersist = new ArrayList<>();

        // carrega projetos de uma vez
        final Set<Long> projectIds = payload.stream()
                .map(ImportDocumentDTO::projectId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        final Map<Long, Project> projectById = projectRepo.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, p -> p));

        for (int idx = 0; idx < payload.size(); idx++) {
            ImportDocumentDTO row = payload.get(idx);

            Long pid      = row.projectId();
            String code   = row.code();
            String title  = row.title();
            String revStr = row.revision() == null ? null : String.valueOf(row.revision()).trim();

            // mínimos obrigatórios
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

            // normalizações básicas
            final String codeKey = code.trim().toUpperCase(Locale.ROOT);
            final String revKey  = (revStr == null || revStr.isBlank()) ? "1" : revStr;

            // >>> sem checagem de duplicidade e sem regra de revisão máxima <<<

            // monta entidade
            Document d = new Document();
            d.setProject(projectById.get(pid));
            d.setCode(codeKey);
            d.setTitle(title.trim());
            d.setRevision(revKey);

            toPersist.add(d);
        }

        if (!toPersist.isEmpty()) {
            docRepo.saveAll(toPersist);

            // atualiza updated_at dos projetos impactados
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
}
