/// src/main/java/com/adi/docflow/service/ProjectService.java
package com.adi.docflow.service;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Organization;
import com.adi.docflow.model.Project;
import com.adi.docflow.model.ProjectMilestone;
import com.adi.docflow.model.ProjectDiscipline;
import com.adi.docflow.model.DisciplineView;

import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.OrganizationRepository;
import com.adi.docflow.repository.ProjectMilestoneRepository;
import com.adi.docflow.repository.ProjectRepository;
import com.adi.docflow.repository.ProjectDisciplineRepository;
import com.adi.docflow.repository.DisciplineLookupRepository;
import com.adi.docflow.repository.ProjectDisciplineDocTypeRepository;   // ✅ NOVO

import com.adi.docflow.web.dto.DocumentDTO;
import com.adi.docflow.web.dto.MilestoneDTO;
import com.adi.docflow.web.dto.ProjectDTO;
import com.adi.docflow.web.dto.ProjectDetailDTO;
import com.adi.docflow.web.dto.ProjectDocTypeDTO;   // ✅ NOVO
import com.adi.docflow.web.dto.CreateProjectDTO;
import com.adi.docflow.web.dto.DisciplineDTO;
import com.adi.docflow.web.dto.OrganizationDTO;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final DocumentRepository documentRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final ProjectDisciplineRepository projectDisciplineRepository;
    private final DisciplineLookupRepository disciplineRepository;

    private final ProjectDisciplineDocTypeRepository projectDisciplineDocTypeRepository; // ✅ NOVO

    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public ProjectService(ProjectRepository projectRepository,
                          DocumentRepository documentRepository,
                          OrganizationRepository organizationRepository,
                          ProjectMilestoneRepository projectMilestoneRepository,
                          ProjectDisciplineRepository projectDisciplineRepository,
                          DisciplineLookupRepository disciplineRepository,
                          ProjectDisciplineDocTypeRepository projectDisciplineDocTypeRepository) {  // ✅ NOVO
        this.projectRepository = projectRepository;
        this.documentRepository = documentRepository;
        this.organizationRepository = organizationRepository;
        this.projectMilestoneRepository = projectMilestoneRepository;
        this.projectDisciplineRepository = projectDisciplineRepository;
        this.disciplineRepository = disciplineRepository;
        this.projectDisciplineDocTypeRepository = projectDisciplineDocTypeRepository;    // ✅ NOVO
    }

    /* ===================== CREATE ===================== */
    @Transactional
    public ProjectDTO create(CreateProjectDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Payload do projeto é obrigatório.");
        }

        // Client (Organization)
        Organization client = null;
        if (dto.clientId() != null) {
            client = organizationRepository.findById(dto.clientId())
                    .orElseThrow(() -> new NoSuchElementException("Cliente não encontrado: " + dto.clientId()));
        }

        // Monta entidade Project
        Project p = new Project();
        p.setCode(safe(dto.code()));
        p.setName(safe(dto.name()));

        // statusInicial (record) -> status (entidade)
        p.setStatus(safe(dto.statusInicial()));

        // Datas
        p.setStartDate(parseDate(dto.dataInicio()));
        p.setPlannedEndDate(parseDate(dto.dataPrevistaConclusao()));

        // Description
        try { p.setDescription(safe(dto.description())); } catch (Throwable ignored) {}

        // Client
        if (client != null) p.setClient(client);

        // Save project
        Project saved = projectRepository.save(p);

        // ===== Disciplinas do projeto =====
        if (dto.disciplinas() != null && !dto.disciplinas().isEmpty()) {
            dto.disciplinas().stream()
                    .filter(Objects::nonNull)
                    .forEach(discDto -> {
                        ProjectDiscipline pd = new ProjectDiscipline();
                        pd.setProject(saved);
                        pd.setDisciplinaId(discDto.disciplinaId());
                        projectDisciplineRepository.save(pd);
                    });
        }

        // ===== Marcos =====
        if (dto.marcos() != null && !dto.marcos().isEmpty()) {
            var toSave = dto.marcos().stream()
                    .filter(Objects::nonNull)
                    .map(m -> {
                        ProjectMilestone ms = new ProjectMilestone();
                        try { ms.setName(safe(m.marcoContratual())); } catch (Throwable ignored) {}
                        try { ms.setDescription(safe(m.descricao())); } catch (Throwable ignored) {}
                        ms.setDueDate(parseDate(m.dataLimite()));
                        ms.setProject(saved);
                        return ms;
                    })
                    .collect(Collectors.toList());
            if (!toSave.isEmpty()) projectMilestoneRepository.saveAll(toSave);
        }

        return toProjectDTO(saved);
    }

    /* ===================== DETAIL ===================== */
    @Transactional(readOnly = true)
    public ProjectDetailDTO getProjectDetail(Long id) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Projeto não encontrado: " + id));

        ProjectDetailDTO dto = new ProjectDetailDTO();
        dto.setId(p.getId());
        dto.setCode(p.getCode());
        dto.setName(p.getName());

        try { dto.setDescription(p.getDescription()); } catch (Throwable ignored) {}
        try { dto.setStatus(p.getStatus()); } catch (Throwable ignored) {}
        try { dto.setStartDate(fmt(p.getStartDate())); } catch (Throwable ignored) {}
        try { dto.setPlannedEndDate(fmt(p.getPlannedEndDate())); } catch (Throwable ignored) {}

        // client
        Organization c = p.getClient();
        if (c != null) {
            try { dto.setClientName(c.getName()); } catch (Throwable ignored) {}
        }

        // milestones
        if (p.getMilestones() != null) {
            List<MilestoneDTO> milestones = p.getMilestones().stream()
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(m -> nullFirst(m.getDueDate())))
                    .map(m -> {
                        MilestoneDTO mDto = new MilestoneDTO();
                        try { mDto.setId(m.getId()); } catch (Throwable ignored) {}
                        try { mDto.setName(m.getName()); } catch (Throwable ignored) {}
                        try { mDto.setDescription(m.getDescription()); } catch (Throwable ignored) {}
                        mDto.setDueDate(fmt(m.getDueDate()));
                        mDto.setProjectId(p.getId());
                        return mDto;
                    })
                    .collect(Collectors.toList());
            dto.setMilestones(milestones);
        }

        // documents reais (mantido, mas não será usado na tela)
        List<Document> docs = documentRepository.findByProjectId(p.getId());
        List<DocumentDTO> docDTOs = docs.stream()
                .map(d -> new DocumentDTO(
                        d.getId(),
                        d.getCode(),
                        d.getTitle() != null ? d.getTitle() : d.getCode(),
                        d.getRevision(),
                        d.getProject() != null ? d.getProject().getId() : null,
                        null, null, null, null, null, null
                )).collect(Collectors.toList());
        dto.setDocuments(docDTOs);

        // ✅ NOVO: tipos de documentos previstos
        List<ProjectDocTypeDTO> planned = projectDisciplineDocTypeRepository
                .findAllByProjectId(p.getId());
        dto.setPlannedDocTypes(planned);   // coloca no DTO

        return dto;
    }

    /* ===================== HELPERS ===================== */

    private String safe(String s) {
        return s == null ? null : s.trim();
    }

    private String fmt(LocalDate d) {
        return d == null ? null : d.format(BR);
    }

    private LocalDate nullFirst(LocalDate d) {
        return d == null ? LocalDate.MIN : d;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        String v = s.trim();
        try { return LocalDate.parse(v, BR); } catch (Exception ignored) {}
        try { return LocalDate.parse(v); } catch (Exception ignored) {}
        throw new IllegalArgumentException("Data inválida: " + v);
    }

    private ProjectDTO toProjectDTO(Project p) {
        Organization client = p.getClient();
        OrganizationDTO clientDTO = null;

        if (client != null) {
            clientDTO = new OrganizationDTO(
                    client.getId(),
                    client.getName(),
                    client.getOrgType(),
                    client.getQtdProjetos()
            );
        }

        return new ProjectDTO(
                p.getId(),
                p.getCode(),
                p.getName(),
                p.getStatus(),
                clientDTO
        );
    }
}
