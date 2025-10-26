package com.adi.docflow.repository;

import com.adi.docflow.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Existe um documento com mesmo (projeto + code + revision)?
    boolean existsByProject_IdAndCodeAndRevision(Long projectId, String code, String revision);

    // Busca todos os documentos com mesmo (projeto + code)
    List<Document> findByProject_IdAndCode(Long projectId, String code);

    // Para numerar sequencialmente por "prefixo" do code (ex.: PLANTAS-BAIXAS-)
    long countByProject_IdAndCodeStartingWith(Long projectId, String codePrefix);
}
