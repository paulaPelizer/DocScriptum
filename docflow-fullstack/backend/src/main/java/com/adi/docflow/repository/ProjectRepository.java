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
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    Page<Project> findByClientId(Long clientId, Pageable pageable);

    Page<Project> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code, String name, Pageable pageable
    );

    // ---------- Listagem p/ tabela ----------
    @Query(
        value = "select new com.adi.docflow.web.dto.ProjectListItemDTO(" +
                " p.id, " +
                " p.name, " +
                " coalesce(c.name, '—'), " +
                " (select count(d) from Document d where d.project.id = p.id), " +
                " p.status, " +
                " p.updatedAt " +
                ") " +
                "from Project p left join p.client c " +
                "where (:status is null or p.status = :status) " +
                "order by p.updatedAt desc",
        countQuery = "select count(p.id) from Project p where (:status is null or p.status = :status)"
    )
    Page<ProjectListItemDTO> findListItemsPage(@Param("status") String status, Pageable pageable);

    @Query(
        "select new com.adi.docflow.web.dto.ProjectListItemDTO(" +
        " p.id, " +
        " p.name, " +
        " coalesce(c.name, '—'), " +
        " (select count(d) from Document d where d.project.id = p.id), " +
        " p.status, " +
        " p.updatedAt " +
        ") " +
        "from Project p left join p.client c " +
        "where (:status is null or p.status = :status) " +
        "order by p.updatedAt desc"
    )
    List<ProjectListItemDTO> findListItems(@Param("status") String status);

    // ---------- Detalhe p/ ProjectService ----------
    // Importante: sem join de documentos, pois Project não tem coleção 'documents'
    @Query("""
        select distinct p
        from Project p
          left join fetch p.client c
          left join fetch p.milestones m
        where p.id = :id
    """)
    Optional<Project> findWithRelations(@Param("id") Long id);
}
