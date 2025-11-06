package com.adi.docflow.repository;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.ProjectSummaryView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectLookupRepository extends JpaRepository<Document, Long> {

    @Query(value = """
        select p.id as id, p.code as code, p.name as name
        from app.project p
        order by p.name asc
    """, nativeQuery = true)
    List<ProjectSummaryView> findAllSummaries();
}
