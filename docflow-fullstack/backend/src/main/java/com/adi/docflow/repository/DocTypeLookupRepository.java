// src/main/java/com/adi/docflow/repository/DocTypeLookupRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.DocTypeView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocTypeLookupRepository
        extends JpaRepository<com.adi.docflow.model.ProjectDisciplineDocType, Long> {

    @Query(value = """
        select
            t.id                         as id,
            t.doc_type                   as code,
            t.doc_type                   as name,
            t.project_discipline_id      as disciplineId
        from app.project_discipline_doc_type t
        join app.project_discipline d on d.id = t.project_discipline_id
        where d.project_id = :projectId
        order by t.doc_type asc
        """, nativeQuery = true)
    List<DocTypeView> findAllAsView(@Param("projectId") Long projectId);
}
