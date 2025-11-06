// src/main/java/com/adi/docflow/service/GrdService.java
package com.adi.docflow.service;

import com.adi.docflow.web.dto.GrdCreateDTO;
import com.adi.docflow.web.dto.GrdResponseDTO;
import com.adi.docflow.web.dto.DocumentDTO;
import com.adi.docflow.model.*;
import com.adi.docflow.repository.GrdRepository;
import com.adi.docflow.repository.RequestRepository;
import com.adi.docflow.repository.RequestDocumentRepository;

import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GrdService {

    private final GrdRepository grdRepository;
    private final RequestRepository requestRepository;
    private final RequestDocumentRepository reqDocRepository;

    private final Random rnd = new Random();

    public GrdService(GrdRepository grdRepository,
                      RequestRepository requestRepository,
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
        String n;
        int tries = 0;
        do {
            int seq = 100000 + rnd.nextInt(900000);
            n = "GRD-" + year + "-" + seq;
        } while (grdRepository.existsByNumber(n) && ++tries < 20);
        return n;
    }

    private String generateUniqueProtocol() {
        int year = OffsetDateTime.now().getYear();
        String p;
        int tries = 0;
        do {
            int seq = 100000 + rnd.nextInt(900000);
            p = "PROT-" + year + "-" + seq;
        } while (grdRepository.existsByProtocol(p) && ++tries < 20);
        return p;
    }

    /* =================== use cases =================== */

    @Transactional
    public GrdResponseDTO create(GrdCreateDTO dto) {
        // 1) Request base (obrigatória)
        Request req = requestRepository.findById(dto.getRequestId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Request " + dto.getRequestId() + " não encontrada"));

        Project project = req.getProject();
        Organization origin = req.getOrigin();
        Organization destination = req.getDestination();

        // 2) Identificadores da GRD
        String number = generateUniqueNumber();
        String protocol = generateUniqueProtocol();

        // 3) Emissão
        String emittedBy = currentUsername();
        OffsetDateTime emissionAt = OffsetDateTime.now();

        // 4) Entidade GRD
        Grd grd = Grd.builder()
                .request(req)
                .project(project)
                .origin(origin)
                .destination(destination)
                .number(number)
                .protocol(protocol)
                .purpose((dto.getPurpose() == null || dto.getPurpose().isBlank())
                        ? req.getPurpose()
                        : dto.getPurpose())
                .deliveryMethod(dto.getDeliveryMethod())
                .observations(dto.getObservations())
                .emittedBy(emittedBy)
                .emissionAt(emissionAt)
                .status("EMITIDA")
                .build();

        grd = grdRepository.save(grd);

        // 5) Status/protocolo na Request (se houver campo protocol)
        req.setStatus(RequestStatus.COMPLETED);
        if (req.getProtocol() == null || req.getProtocol().isBlank()) {
            req.setProtocol(protocol);
        }
        requestRepository.save(req);

        // 6) Carrega documentos da Request via tabela de junção
        List<Document> docs = reqDocRepository.findDocumentsByRequestId(req.getId());
        int totalDocs = docs.size();

        Integer totalPages = reqDocRepository.sumPagesByRequestId(req.getId());
        if (totalPages == null) totalPages = 0;

        // 7) DTOs de documentos para a GRD
        List<DocumentDTO> docDTOs = docs.stream()
                .map(this::toDocDTO)
                .collect(Collectors.toList());

        // 8) Retorno completo para o front
        return toResponse(grd, req, totalDocs, totalPages, docDTOs);
    }

    public Optional<GrdResponseDTO> findByProtocol(String protocol) {
        return grdRepository.findByProtocol(protocol)
                .map(g -> {
                    Request req = g.getRequest();
                    List<Document> docs = (req != null)
                            ? reqDocRepository.findDocumentsByRequestId(req.getId())
                            : Collections.emptyList();

                    int totalDocs = docs.size();
                    Integer totalPages = (req != null)
                            ? reqDocRepository.sumPagesByRequestId(req.getId())
                            : 0;
                    if (totalPages == null) totalPages = 0;

                    List<DocumentDTO> docDTOs = docs.stream()
                            .map(this::toDocDTO)
                            .toList();

                    return toResponse(g, req, totalDocs, totalPages, docDTOs);
                });
    }

    /* =================== mappers =================== */

    private DocumentDTO toDocDTO(Document d) {
        return new DocumentDTO(
                d.getId(),
                d.getCode(),
                d.getTitle(),
                d.getRevision(),
                d.getProject() != null ? d.getProject().getId() : null
        );
    }

    private GrdResponseDTO toResponse(Grd g,
                                      Request req,
                                      int totalDocs,
                                      int totalPages,
                                      List<DocumentDTO> docs) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/uuuu HH:mm", new Locale("pt", "BR"));

        return GrdResponseDTO.builder()
                // Request (incluímos número e protocolo para a GRD)
                .requestId(req != null ? req.getId() : null)
                .requestNumber(req != null ? req.getRequestNumber() : null)
                .requestProtocol(req != null ? req.getProtocol() : null)

                // Projeto
                .projectId(g.getProject() != null ? g.getProject().getId() : null)
                .projectCode(g.getProject() != null ? g.getProject().getCode() : null)
                .projectName(g.getProject() != null ? g.getProject().getName() : null)

                // Organizações
                .originId(g.getOrigin() != null ? g.getOrigin().getId() : null)
                .originName(g.getOrigin() != null ? g.getOrigin().getName() : null)
                .destinationId(g.getDestination() != null ? g.getDestination().getId() : null)
                .destinationName(g.getDestination() != null ? g.getDestination().getName() : null)

                // Identificadores GRD
                .id(g.getId())
                .number(g.getNumber())
                .protocol(g.getProtocol())

                // Conteúdo
                .purpose(g.getPurpose())
                .deliveryMethod(g.getDeliveryMethod())
                .observations(g.getObservations())

                // Emissão/Status
                .emittedBy(g.getEmittedBy())
                .emissionAt(g.getEmissionAt())
                .emissionAtText(g.getEmissionAt() != null ? g.getEmissionAt().format(fmt) : null)
                .status(g.getStatus())

                // Totais e lista de docs
                .totalDocuments(totalDocs)
                .totalPages(totalPages)
                .documents(docs)
                .build();
    }
}
