package com.adi.docflow.service;

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
