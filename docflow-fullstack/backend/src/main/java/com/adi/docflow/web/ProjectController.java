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

import com.adi.docflow.web.dto.CreateProjectDTO;
import com.adi.docflow.web.dto.OrganizationDTO;
import com.adi.docflow.web.dto.ProjectDTO;
import com.adi.docflow.web.dto.ProjectListItemDTO;
import com.adi.docflow.web.dto.ProjectDetailDTO;

import com.adi.docflow.service.ProjectService;

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

import java.util.ArrayList;
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
    private final DocumentRepository docRepo;
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

    // ---- helpers ----
    private static final DateTimeFormatter PT_BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static LocalDate parseDateOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s, PT_BR_DATE);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(BAD_REQUEST, "Datas devem estar no formato dd/MM/yyyy");
        }
    }

    // normaliza para código (SLUG MAIÚSCULO sem acentos; espaços/nao-alfanuméricos viram '-')
    private static String slug(String raw) {
        if (raw == null) return "";
        String n = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");                // remove acentos
        n = n.replaceAll("[^\\p{Alnum}]+", "-");          // não alfanumérico -> '-'
        n = n.replaceAll("(^-+|-+$)", "");                // tira hífens das pontas
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

    // ---------- ENDPOINTS ----------

    /** DEV: liberar criação sem JWT para depuração de 403 */
    @PermitAll
    @PostMapping
    @Transactional
    public ResponseEntity<ProjectDTO> create(@RequestBody CreateProjectDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(BAD_REQUEST, "payload obrigatório");
        }
        if (dto.name() == null || dto.name().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "name é obrigatório");
        }
        if (dto.code() == null || dto.code().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "code é obrigatório");
        }

        // monta entidade
        Project p = new Project();
        p.setCode(dto.code().trim());
        p.setName(dto.name().trim());

        if (dto.clientId() != null) {
            Organization client = orgRepo.findById(dto.clientId())
                    .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "clientId inválido"));
            p.setClient(client);
        }

        p.setDescription(dto.description()); // OK para record
        p.setStatus(dto.statusInicial());    // pode ser null
        p.setStartDate(parseDateOrNull(dto.dataInicio()));
        p.setPlannedEndDate(parseDateOrNull(dto.dataPrevistaConclusao()));
        p.setUpdatedAt(Instant.now());

        // salva projeto para obter ID
        Project saved = projectRepo.save(p);

        // ================== DISCIPLINAS (tolerante a DTO leve/rico) ==================
        if (dto.disciplinas() != null && !dto.disciplinas().isEmpty()) {
            for (var d : dto.disciplinas()) {
                if (d == null) continue;

                // tenta ler por vários nomes de métodos (record/POJO/versão antiga)
                Long disciplinaId      = tryLong(d, "disciplinaId", "id", "getDisciplinaId", "getId");
                String disciplinaNome  = tryString(d, "disciplinaNome", "name", "getDisciplinaNome", "getName");
                Boolean destCliente    = tryBool(d, "destinatarioCliente", "getDestinatarioCliente");
                Boolean destInterno    = tryBool(d, "destinatarioInterno", "getDestinatarioInterno");

                ProjectDiscipline pd = new ProjectDiscipline();
                pd.setProject(saved);
                pd.setDisciplinaId(disciplinaId);
                pd.setDisciplinaNome(disciplinaNome);
                pd.setDestinatarioCliente(destCliente);
                pd.setDestinatarioInterno(destInterno);
                pd = projDiscRepo.save(pd);

                // Tipos/quantidades (se existirem no DTO)
                List<?> tipos = tryList(d, "tipos", "getTipos");
                if (tipos != null && !tipos.isEmpty()) {
                    for (Object t : tipos) {
                        if (t == null) continue;

                        String tipo = tryString(t, "tipo", "getTipo");
                        Integer quantidade = tryInt(t, "quantidade", "getQuantidade");
                        if (tipo == null || tipo.isBlank()) continue;

                        final int qtd = (quantidade == null ? 0 : quantidade);

                        ProjectDisciplineDocType dt = new ProjectDisciplineDocType();
                        dt.setProjectDiscipline(pd);
                        dt.setDocType(tipo.trim());
                        dt.setQuantity(qtd);
                        projDiscDocTypeRepo.save(dt);

                        // gerar N placeholders na tabela app.document
                        if (qtd > 0) {
                            String prefix = slug(tipo);
                            List<Document> slots = new ArrayList<>(qtd);
                            for (int i = 1; i <= qtd; i++) {
                                Document doc = new Document();
                                doc.setProject(saved);
                                doc.setTitle(tipo);           // nome do tipo como título
                                doc.setCode(String.format("%s-%03d", prefix, i));
                                doc.setRevision("1");
                                doc.setFormat(null);
                                doc.setPages(null);
                                doc.setFileUrl(null);
                                slots.add(doc);
                            }
                            docRepo.saveAll(slots);
                        }
                    }
                }
            }
        }
        // ============================================================================

        // marcos contratuais (opcionais)
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

    @GetMapping("/{id}")
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<ProjectDTO> get(@PathVariable("id") Long id) {
        return projectRepo.findById(id)
                .map(p -> ResponseEntity.ok(toDTO(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Detalhe completo (dados + marcos + documentos) */
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
            List<ProjectListItemDTO> slice = (start >= items.size()) ? List.of() : items.subList(start, end);
            return new PageImpl<>(slice, pageable, items.size());
        }
    }

    /* ==================== HELPERS REFLEXIVOS TOLERANTES ==================== */

    private static String tryString(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try { var mm = obj.getClass().getMethod(m); var v = mm.invoke(obj); return v == null ? null : v.toString(); }
            catch (Exception ignored) {}
        }
        return null;
    }
    private static Long tryLong(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m); Object v = mm.invoke(obj);
                if (v instanceof Number n) return n.longValue();
                if (v instanceof String s && !s.isBlank()) return Long.parseLong(s);
            } catch (Exception ignored) {}
        }
        return null;
    }
    private static Integer tryInt(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m); Object v = mm.invoke(obj);
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
                var mm = obj.getClass().getMethod(m); Object v = mm.invoke(obj);
                if (v instanceof List<?> list) return list;
            } catch (Exception ignored) {}
        }
        return null;
    }
    private static Boolean tryBool(Object obj, String... methodNames) {
        for (String m : methodNames) {
            try {
                var mm = obj.getClass().getMethod(m); Object v = mm.invoke(obj);
                if (v instanceof Boolean b) return b;
                if (v instanceof String s) return Boolean.parseBoolean(s);
                if (v instanceof Number n) return n.intValue() != 0;
            } catch (Exception ignored) {}
        }
        return null;
    }
}
