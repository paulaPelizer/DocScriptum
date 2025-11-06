/*package com.adi.docflow.service;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Organization;
import com.adi.docflow.model.Project;
import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.ProjectRepository;
import com.adi.docflow.web.dto.DocumentDTO;
import com.adi.docflow.web.dto.MilestoneDTO;
import com.adi.docflow.web.dto.ProjectDetailDTO;
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

    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public ProjectService(ProjectRepository projectRepository,
                          DocumentRepository documentRepository) {
        this.projectRepository = projectRepository;
        this.documentRepository = documentRepository;
    }

    @Transactional(readOnly = true)
    public ProjectDetailDTO getProjectDetail(Long id) {
        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Projeto não encontrado: " + id));

        ProjectDetailDTO dto = new ProjectDetailDTO();
        dto.setId(p.getId());
        dto.setCode(p.getCode());
        dto.setName(p.getName());

        // description: se não existir na entidade, removemos
        try { dto.setDescription(p.getDescription()); } catch (Throwable ignored) {}

        // status (existe na sua entidade)
        try { dto.setStatus(p.getStatus()); } catch (Throwable ignored) {}

        // datas (seus getters corretos: getStartDate() e getPlannedEndDate())
        try { dto.setStartDate(fmt(p.getStartDate())); } catch (Throwable ignored) {}
        try { dto.setPlannedEndDate(fmt(p.getPlannedEndDate())); } catch (Throwable ignored) {}

        // cliente (Organization)
        Organization c = p.getClient();
        if (c != null) {
            dto.setId(c.getId());
            dto.setClientName(c.getName());
        }

        // --- Milestones (sua entidade ProjectMilestone) ---
        // Você já tem p.getMilestones() no Project
        List<MilestoneDTO> milestones = null;
        if (p.getMilestones() != null) {
            milestones = p.getMilestones().stream()
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(m -> nullFirst(m.getDueDate())))
                    .map(m -> {
                        MilestoneDTO mDto = new MilestoneDTO();
                        mDto.setId(m.getId());
                        mDto.setName(m.getName());
                        mDto.setDescription(m.getDescription());
                        mDto.setDueDate(fmt(m.getDueDate()));
                        // Sem status/documentsCount na sua entidade atual
                        mDto.setProjectId(p.getId());
                        return mDto;
                    })
                    .collect(Collectors.toList());
        }
        dto.setMilestones(milestones);

        // --- Documents (busca por projectId no repositório) ---
        List<Document> docs = documentRepository.findByProjectId(p.getId());
        List<DocumentDTO> docDTOs = docs.stream()
                .map(d -> new DocumentDTO(
                        d.getId(),
                        d.getCode(),
                        d.getTitle(),                 // troque para d.getName() se o campo for "name"
                        d.getRevision(),              // se sua revisão for Integer, mude para String.valueOf(...)
                        d.getProject() != null ? d.getProject().getId() : null,
                        // extras opcionais (se sua entidade não tiver, deixamos null)
                        null,                         // type
                        null,                         // status
                        null,                         // milestoneName
                        null,                         // fileName
                        null,                         // lastModified
                        null                          // uploadedBy
                ))
                .collect(Collectors.toList());
        dto.setDocuments(docDTOs);

        return dto;
    }

    private String fmt(LocalDate d) {
        return d == null ? null : d.format(BR);
    }

    // Ordena com nulos primeiro
    private LocalDate nullFirst(LocalDate d) {
        return d == null ? LocalDate.MIN : d;
    }
}
*/
package com.adi.docflow.service;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Organization;
import com.adi.docflow.model.Project;
import com.adi.docflow.model.ProjectMilestone;

import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.OrganizationRepository;
import com.adi.docflow.repository.ProjectMilestoneRepository;
import com.adi.docflow.repository.ProjectRepository;

import com.adi.docflow.web.dto.DocumentDTO;
import com.adi.docflow.web.dto.MilestoneDTO;
import com.adi.docflow.web.dto.ProjectDTO;
import com.adi.docflow.web.dto.ProjectDetailDTO;
import com.adi.docflow.web.dto.CreateProjectDTO;

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

    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public ProjectService(ProjectRepository projectRepository,
                          DocumentRepository documentRepository,
                          OrganizationRepository organizationRepository,
                          ProjectMilestoneRepository projectMilestoneRepository) {
        this.projectRepository = projectRepository;
        this.documentRepository = documentRepository;
        this.organizationRepository = organizationRepository;
        this.projectMilestoneRepository = projectMilestoneRepository;
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
        // Datas (dto vem como "dd/MM/yyyy" ou ISO)
        p.setStartDate(parseDate(dto.dataInicio()));
        p.setPlannedEndDate(parseDate(dto.dataPrevistaConclusao()));
        // Description (se existir na entidade)
        try { p.setDescription(safe(dto.description())); } catch (Throwable ignored) {}

        // Relaciona cliente
        if (client != null) {
            p.setClient(client);
        }

        // Persiste projeto
        Project saved = projectRepository.save(p);
            
        // Marcos (CREATE)
        if (dto.marcos() != null && !dto.marcos().isEmpty()) {
          var toSave = dto.marcos().stream()
              .filter(Objects::nonNull)
              .map(m -> {
                ProjectMilestone ms = new ProjectMilestone();
                try { ms.setName(safe(m.marcoContratual())); } catch (Throwable ignored) {}
                try { ms.setDescription(safe(m.descricao())); } catch (Throwable ignored) {}
                ms.setDueDate(parseDate(m.dataLimite()));
                ms.setProject(saved);   // <-- usa a referência final aqui
                return ms;
              })
              .collect(Collectors.toList());
          if (!toSave.isEmpty()) {
            projectMilestoneRepository.saveAll(toSave);
          }
        }

        // Retorna DTO resumido
        return toProjectDTO(p);
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

        // description
        try { dto.setDescription(p.getDescription()); } catch (Throwable ignored) {}

        // status
        try { dto.setStatus(p.getStatus()); } catch (Throwable ignored) {}

        // datas
        try { dto.setStartDate(fmt(p.getStartDate())); } catch (Throwable ignored) {}
        try { dto.setPlannedEndDate(fmt(p.getPlannedEndDate())); } catch (Throwable ignored) {}

        // cliente (corrigido: setClientId/Name sem sobrescrever id do projeto)
        Organization c = p.getClient();
        if (c != null) {
            try { dto.setId(c.getId()); } catch (Throwable ignored) {}
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

        // documents por projectId
        List<Document> docs = documentRepository.findByProjectId(p.getId());
        List<DocumentDTO> docDTOs = docs.stream()
                .map(d -> new DocumentDTO(
                        d.getId(),
                        d.getCode(),
                        // use d.getTitle() ou d.getName() conforme sua entidade
                        d.getTitle() != null ? d.getTitle() : d.getCode(),
                        d.getRevision(),
                        d.getProject() != null ? d.getProject().getId() : null,
                        null, // type
                        null, // status
                        null, // milestoneName
                        null, // fileName
                        null, // lastModified
                        null  // uploadedBy
                ))
                .collect(Collectors.toList());
        dto.setDocuments(docDTOs);

        return dto;
    }

    /* ===================== HELPERS ===================== */

    private String safe(String s) {
        return s == null ? null : s.trim();
    }

    private String fmt(LocalDate d) {
        return d == null ? null : d.format(BR);
    }

    // Ordena com nulos primeiro
    private LocalDate nullFirst(LocalDate d) {
        return d == null ? LocalDate.MIN : d;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        String v = s.trim();
        // tenta dd/MM/yyyy (padrão que você usa no controller)
        try { return LocalDate.parse(v, BR); } catch (Exception ignored) {}
        // fallback ISO (yyyy-MM-dd) — útil quando vem do Swagger
        try { return LocalDate.parse(v); } catch (Exception ignored) {}
        throw new IllegalArgumentException("Data inválida: " + v + " (use dd/MM/yyyy)");
    }

    /* converte para ProjectDTO resumido (id, code, name, status, client) */
    private ProjectDTO toProjectDTO(Project p) {
        return new ProjectDTO(
                p.getId(),
                p.getCode(),
                p.getName(),
                p.getStatus(),
                p.getClient() == null ? null :
                        new com.adi.docflow.web.dto.OrganizationDTO(
                                p.getClient().getId(),
                                p.getClient().getName(),
                                p.getClient().getOrgType(),
                                p.getClient().getQtdProjetos()
                        )
        );
    }
}
