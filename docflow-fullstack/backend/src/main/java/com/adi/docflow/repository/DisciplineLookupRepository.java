// src/main/java/com/adi/docflow/repository/DisciplineLookupRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.DisciplineView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisciplineLookupRepository
        extends JpaRepository<com.adi.docflow.model.ProjectDiscipline, Long> {

    @Query(value = """
        select
            d.disciplina_id                              as id,
            CONVERT(varchar(50), d.disciplina_id)        as code,   -- SQL Server
            d.disciplina_nome                            as name
        from app.project_discipline d
        where d.project_id = :projectId
        group by d.disciplina_id, d.disciplina_nome
        order by d.disciplina_nome asc
        """, nativeQuery = true)
    List<DisciplineView> findAllAsView(@Param("projectId") Long projectId);
}
