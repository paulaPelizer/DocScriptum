package com.adi.docflow.repository;

import com.adi.docflow.model.Document;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    // === métodos já existentes (mantidos) ===
    List<Document> findByProjectId(Long projectId);
    List<Document> findByClientId(Long clientId);
    List<Document> findByDisciplineId(Long disciplineId);
    List<Document> findByDocumentTypeId(Long documentTypeId);
    List<Document> findByProjectIdAndDocumentTypeId(Long projectId, Long documentTypeId);
    List<Document> findByStatus(String status);

    // Mantido exatamente como estava (não muda assinatura para evitar quebrar chamadas antigas)
    Document findByUploadHash(String uploadHash);

    // === adições NÃO-invasivas (overloads paginados) ===
    Page<Document> findByProjectId(Long projectId, Pageable pageable);
    Page<Document> findByClientId(Long clientId, Pageable pageable);
    Page<Document> findByDisciplineId(Long disciplineId, Pageable pageable);
    Page<Document> findByDocumentTypeId(Long documentTypeId, Pageable pageable);
    Page<Document> findByProjectIdAndDocumentTypeId(Long projectId, Long documentTypeId, Pageable pageable);
    Page<Document> findByStatus(String status, Pageable pageable);

    // === busca por ID já trazendo o project (evita ByteBuddy/Lazy 500) ===
    @Query("""
      select d from Document d
      left join fetch d.project p
      where d.id = :id
    """)
    Optional<Document> findByIdWithProject(@Param("id") Long id);

    // === NOVO: busca por HASH já trazendo o project (para tela de edição via hash) ===
    @Query("""
      select d from Document d
      left join fetch d.project p
      where d.uploadHash = :hash
    """)
    Optional<Document> findByUploadHashWithProject(@Param("hash") String hash);
}
