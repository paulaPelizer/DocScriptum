// src/main/java/com/adi/docflow/repository/ProjectDisciplineDocTypeRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.ProjectDisciplineDocType;
import com.adi.docflow.web.dto.ProjectDocTypeDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectDisciplineDocTypeRepository
        extends JpaRepository<ProjectDisciplineDocType, Long> {

    @Query("""
        select new com.adi.docflow.web.dto.ProjectDocTypeDTO(
            pddt.id,
            pd.id,
            pd.disciplinaNome,
            pddt.docType,
            pddt.quantity
        )
        from ProjectDisciplineDocType pddt
            join pddt.projectDiscipline pd
            join pd.project p
        where p.id = :projectId
        order by pd.disciplinaNome, pddt.docType
        """)
    List<ProjectDocTypeDTO> findAllByProjectId(@Param("projectId") Long projectId);
}
