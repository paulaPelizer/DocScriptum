// src/main/java/com/adi/docflow/repository/ProjectRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.Project;
import com.adi.docflow.web.dto.ProjectListItemDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    // ====== usados pelo GET /api/v1/projects (lista simples) ======
    Page<Project> findByClientId(Long clientId, Pageable pageable);

    Page<Project> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code,
            String name,
            Pageable pageable
    );

    // ====== usados pelo GET /api/v1/projects/table (lista com contagem de documentos) ======

    @Query("""
        select new com.adi.docflow.web.dto.ProjectListItemDTO(
            p.id,
            p.code,
            p.name,
            coalesce(c.name, ''),
            coalesce(sum(dt.quantity), 0),
            p.status,
            p.updatedAt
        )
        from Project p
        left join p.client c
        left join ProjectDiscipline pd on pd.project = p
        left join ProjectDisciplineDocType dt on dt.projectDiscipline = pd
        where (:status is null or p.status = :status)
        group by p.id, p.code, p.name, c.name, p.status, p.updatedAt
        order by p.id desc
        """)
    Page<ProjectListItemDTO> findListItemsPage(
            @Param("status") String status,
            Pageable pageable
    );

    @Query("""
        select new com.adi.docflow.web.dto.ProjectListItemDTO(
            p.id,
            p.code,
            p.name,
            coalesce(c.name, ''),
            coalesce(sum(dt.quantity), 0),
            p.status,
            p.updatedAt
        )
        from Project p
        left join p.client c
        left join ProjectDiscipline pd on pd.project = p
        left join ProjectDisciplineDocType dt on dt.projectDiscipline = pd
        where (:status is null or p.status = :status)
        group by p.id, p.code, p.name, c.name, p.status, p.updatedAt
        order by p.id desc
        """)
    List<ProjectListItemDTO> findListItems(@Param("status") String status);
}
