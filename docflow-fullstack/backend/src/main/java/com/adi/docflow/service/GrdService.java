// src/main/java/com/adi/docflow/service/GrdService.java
package com.adi.docflow.service;

import com.adi.docflow.web.dto.GrdCreateDTO;
import com.adi.docflow.web.dto.GrdResponseDTO;
import com.adi.docflow.repository.GrdRepository;
import com.adi.docflow.repository.RequestDocumentRepository;

import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class GrdService {

    private final GrdRepository grdRepository;
    private final RequestDocumentRepository requestRepository;
    private final RequestDocumentRepository reqDocRepository;

    private final Random rnd = new Random();

    public GrdService(GrdRepository grdRepository,
                      RequestDocumentRepository requestRepository,
                      RequestDocumentRepository reqDocRepository) {
        this.grdRepository = grdRepository;
        this.requestRepository = requestRepository;
        this.reqDocRepository = reqDocRepository;
    }

    /* =================== helpers =================== */

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth == null || auth.getName() == null || auth.getName().isBlank())
                ? "Sistema"
                : auth.getName();
    }

    private String generateUniqueNumber() {
        int year = OffsetDateTime.now().getYear();
        int seq = 100000 + rnd.nextInt(900000);
        return "GRD-" + year + "-" + seq;
    }

    private String generateUniqueProtocol() {
        int year = OffsetDateTime.now().getYear();
        int seq = 100000 + rnd.nextInt(900000);
        return "PROT-" + year + "-" + seq;
    }

    /* =================== CORINGA PRA RODAR =================== */

    @Transactional
    public GrdResponseDTO create(GrdCreateDTO dto) {
        // --- IMPLEMENTAÇÃO REAL COMENTADA SÓ PRA COMPILAR ---
        /*
        Request req = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Request " + dto.getRequestId() + " não encontrada"));

        // ... resto da lógica original ...
        */

        // Retorno de emergência só pra não quebrar compilação
        return null;
    }

    public Optional<GrdResponseDTO> findByProtocol(String protocol) {
        // --- IMPLEMENTAÇÃO REAL COMENTADA SÓ PRA COMPILAR ---
        /*
        return grdRepository.findByProtocol(protocol)
                .map(g -> {
                    // montar DTO
                    return toResponse(...);
                });
        */

        // Retorno de emergência
        return Optional.empty();
    }
}
