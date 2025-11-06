// src/main/java/com/adi/docflow/repository/RequestDocumentRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.RequestDocument;
import com.adi.docflow.model.Document;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RequestDocumentRepository extends JpaRepository<RequestDocument, Long> {

    List<RequestDocument> findByRequestId(Long requestId);

    /** Retorna os Document diretamente (útil para montar a GRD) */
    @Query("""
           select d
             from RequestDocument rd
             join rd.document d
            where rd.request.id = :requestId
           order by d.code asc
           """)
    List<Document> findDocumentsByRequestId(@Param("requestId") Long requestId);

    /** Total de páginas (assumindo campo pages em Document; ajuste o nome se preciso). */
    @Query("""
           select coalesce(sum(d.pages), 0)
             from RequestDocument rd
             join rd.document d
            where rd.request.id = :requestId
           """)
    Integer sumPagesByRequestId(@Param("requestId") Long requestId);
}
