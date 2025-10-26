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

    Page<Project> findByClientId(Long clientId, Pageable pageable);

    Page<Project> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(
            String code, String name, Pageable pageable
    );

    // -------- Listagem para a página /table --------
    // Observação: a entidade de documento deve se chamar "Document" e ter ManyToOne "project".
    // Se o nome/relacionamento for diferente, me diga que ajusto a cláusula "from Document d where d.project.id = p.id".

    @Query(
        value = "select new com.adi.docflow.web.dto.ProjectListItemDTO(" +
                " p.id, " +
                " p.name, " +
                " coalesce(c.name, '—'), " +
                " (select count(d) from Document d where d.project.id = p.id), " + // conta docs por projeto
                " p.status, " +
                " p.updatedAt " +                                                // simples e compatível
                ") " +
                "from Project p " +
                "left join p.client c " +
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
        "from Project p " +
        "left join p.client c " +
        "where (:status is null or p.status = :status) " +
        "order by p.updatedAt desc"
    )
    List<ProjectListItemDTO> findListItems(@Param("status") String status);
}
