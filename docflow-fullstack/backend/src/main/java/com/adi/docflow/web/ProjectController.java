package com.adi.docflow.web;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Organization;
import com.adi.docflow.model.Project;
import com.adi.docflow.model.ProjectDiscipline;
import com.adi.docflow.model.ProjectDisciplineDocType;
import com.adi.docflow.model.ProjectMilestone;

import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.OrganizationRepository;
import com.adi.docflow.repository.ProjectRepository;
import com.adi.docflow.repository.ProjectDisciplineRepository;
import com.adi.docflow.repository.ProjectDisciplineDocTypeRepository;
import com.adi.docflow.repository.ProjectMilestoneRepository;

import com.adi.docflow.service.ProjectService;

import com.adi.docflow.web.dto.CreateProjectDTO;
import com.adi.docflow.web.dto.OrganizationDTO;
import com.adi.docflow.web.dto.ProjectDTO;
import com.adi.docflow.web.dto.ProjectDetailDTO;
import com.adi.docflow.web.dto.ProjectListItemDTO;

import jakarta.annotation.security.PermitAll;
import jakarta.transaction.Transactional;

import org.springdoc.core.annotations.ParameterObject;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.NoSuchElementException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/v1/projects")
@CrossOrigin(origins = { "http://localhost:5173", "http://127.0.0.1:5173" }, allowCredentials = "true")
public class ProjectController {

    private final ProjectRepository projectRepo;
    private final OrganizationRepository orgRepo;
    private final ProjectDisciplineRepository projDiscRepo;
    private final ProjectDisciplineDocTypeRepository projDiscDocTypeRepo;
    private final ProjectMilestoneRepository milestoneRepo;
    private final DocumentRepository docRepo; // agora fica sem uso, mas não quebra nada
    private final ProjectService projectService;

    public ProjectController(
            ProjectRepository projectRepo,
            OrganizationRepository orgRepo,
            ProjectDisciplineRepository projDiscRepo,
            ProjectDisciplineDocTypeRepository projDiscDocTypeRepo,
            ProjectMilestoneRepository milestoneRepo,
            DocumentRepository docRepo,
            ProjectService projectService
    ) {
        this.projectRepo = projectRepo;
        this.orgRepo = orgRepo;
        this.projDiscRepo = projDiscRepo;
        this.projDiscDocTypeRepo = projDiscDocTypeRepo;
        this.milestoneRepo = milestoneRepo;
        this.docRepo = docRepo;
        this.projectService = projectService;
    }

    private static final DateTimeFormatter PT_BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static LocalDate parseDateOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s, PT_BR_DATE);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Datas devem estar no formato dd/MM/yyyy");
        }
    }

    private static String slug(String raw) {
        if (raw == null) return "";
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        n = n.replaceAll("[^\\p{Alnum}]+", "-");
        n = n.replaceAll("(^-+|-+$)", "");
        return n.toUpperCase();
    }

    private OrganizationDTO toDTO(Organization o) {
        if (o == null) return null;
        return new OrganizationDTO(o.getId(), o.getName(), o.getOrgType(), o.getQtdProjetos());
    }

    private ProjectDTO toDTO(Project p) {
        if (p == null) return null;
        return new ProjectDTO(
                p.getId(),
                p.getCode(),
                p.getName(),
                p.getStatus(),
                toDTO(p.getClient())
        );
    }

    // ===========================================================
    //                     POST CREATE PROJECT
    // ===========================================================
    @PermitAll
    @PostMapping
    @Transactional
    public ResponseEntity<ProjectDTO> create(@RequestBody CreateProjectDTO dto) {

        if (dto == null)
            throw new ResponseStatusException(BAD_REQUEST, "payload obrigatório");

        if (dto.name() == null || dto.name().isBlank())
            throw new ResponseStatusException(BAD_REQUEST, "name é obrigatório");

        if (dto.code() == null || dto.code().isBlank())
            throw new ResponseStatusException(BAD_REQUEST, "code é obrigatório");

        Project p = new Project();
        p.setCode(dto.code().trim());
        p.setName(dto.name().trim());

        if (dto.clientId() != null) {
            Organization client = orgRepo.findById(dto.clientId())
                    .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "clientId inválido"));
            p.setClient(client);
        }

        p.setDescription(dto.description());
        p.setStatus(dto.statusInicial());
        p.setStartDate(parseDateOrNull(dto.dataInicio()));
        p.setPlannedEndDate(parseDateOrNull(dto.dataPrevistaConclusao()));
        p.setUpdatedAt(Instant.now());

        Project saved = projectRepo.save(p);

        // ↓↓↓ DISCIPLINAS ======================================================
        if (dto.disciplinas() != null && !dto.disciplinas().isEmpty()) {

            for (CreateProjectDTO.DisciplineDTO d : dto.disciplinas()) {
                if (d == null) continue;

                ProjectDiscipline pd = new ProjectDiscipline();
                pd.setProject(saved);

                // campos da disciplina
                pd.setDisciplinaId(d.disciplinaId());      // Long
                pd.setDisciplinaNome(d.disciplinaNome());  // String

                // agora são Strings (nome/contato do destinatário)
                pd.setDestinatarioCliente(d.destinatarioCliente());
                pd.setDestinatarioInterno(d.destinatarioInterno());

                pd = projDiscRepo.save(pd);

                // ------- TIPOS DE DOCUMENTOS POR DISCIPLINA -------
                if (d.tipos() != null && !d.tipos().isEmpty()) {

                    for (CreateProjectDTO.TipoDTO t : d.tipos()) {
                        if (t == null) continue;

                        String tipoDoc = t.tipo();
                        if (tipoDoc == null || tipoDoc.isBlank()) continue;

                        Integer qtdObj = t.quantidade();
                        int qtd = (qtdObj == null ? 0 : qtdObj);

                        ProjectDisciplineDocType dt = new ProjectDisciplineDocType();
                        dt.setProjectDiscipline(pd);
                        dt.setDocType(tipoDoc.trim());
                        dt.setQuantity(qtd);
                        projDiscDocTypeRepo.save(dt);

                        // ✅ AQUI ERA ONDE CRIAVA DOCUMENTOS NA TABELA DOCUMENT.
                        // Removido para não gerar mais slots automáticos.
                    }
                }
            }
        }

        // ↓↓↓ MARCOS ======================================================
        if (dto.marcos() != null && !dto.marcos().isEmpty()) {
            for (var m : dto.marcos()) {
                if (m == null || m.marcoContratual() == null || m.marcoContratual().isBlank()) continue;

                ProjectMilestone ms = new ProjectMilestone();
                ms.setProject(saved);
                ms.setName(m.marcoContratual().trim());
                ms.setDueDate(parseDateOrNull(m.dataLimite()));
                ms.setDescription(m.descricao());
                milestoneRepo.save(ms);
            }
        }

        return ResponseEntity
                .created(URI.create("/api/v1/projects/" + saved.getId()))
                .body(toDTO(saved));
    }

    // ===========================================================
    //                     GETS
    // ===========================================================

    @GetMapping("/{id}")
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<ProjectDTO> get(@PathVariable("id") Long id) {
        return projectRepo.findById(id)
                .map(p -> ResponseEntity.ok(toDTO(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PermitAll
@GetMapping("/{id}/detail")
@Transactional(Transactional.TxType.SUPPORTS)
public ResponseEntity<ProjectDetailDTO> getDetail(@PathVariable("id") Long id) {
    try {
        return ResponseEntity.ok(projectService.getProjectDetail(id));
    } catch (NoSuchElementException e) {
        return ResponseEntity.notFound().build();
    }
}

    @GetMapping
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<ProjectDTO> list(
            @RequestParam(name = "clientId", required = false) Long clientId,
            @RequestParam(name = "q", required = false) String q,
            @ParameterObject
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<Project> page;

        if (clientId != null) {
            page = projectRepo.findByClientId(clientId, pageable);
        } else if (q != null && !q.isBlank()) {
            page = projectRepo.findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(q, q, pageable);
        } else {
            page = projectRepo.findAll(pageable);
        }
        return page.map(this::toDTO);
    }

    @GetMapping("/table")
    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<ProjectListItemDTO> listTable(
            @RequestParam(name = "status", required = false) String status,
            @ParameterObject
            @PageableDefault(size = 20) Pageable pageable
    ) {
        try {
            return projectRepo.findListItemsPage(status, pageable);
        } catch (NoSuchMethodError | org.springframework.dao.InvalidDataAccessApiUsageException e) {

            List<ProjectListItemDTO> items = projectRepo.findListItems(status);
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), items.size());
            List<ProjectListItemDTO> slice =
                    (start >= items.size()) ? List.of() : items.subList(start, end);

            return new PageImpl<>(slice, pageable, items.size());
        }
    }

    // ===========================================================
    //  Helpers de Reflexão (usados pelos GETs da tabela)
    // ===========================================================

    private static String tryString(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m);
                var v = mm.invoke(obj);
                return v == null ? null : v.toString();
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Long tryLong(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m);
                Object v = mm.invoke(obj);
                if (v instanceof Number n) return n.longValue();
                if (v instanceof String s && !s.isBlank()) return Long.parseLong(s);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Integer tryInt(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m);
                Object v = mm.invoke(obj);
                if (v instanceof Number n) return n.intValue();
                if (v instanceof String s && !s.isBlank()) return Integer.parseInt(s);
            } catch (Exception ignored) {}
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<?> tryList(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m);
                Object v = mm.invoke(obj);
                if (v instanceof List<?> list) return list;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Boolean tryBool(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m);
                Object v = mm.invoke(obj);
                if (v instanceof Boolean b) return b;
                if (v instanceof String s) return Boolean.parseBoolean(s);
                if (v instanceof Number n) return n.intValue() != 0;
            } catch (Exception ignored) {}
        }
        return null;
    }
}
