// src/main/java/com/adi/docflow/web/RequestController.java
package com.adi.docflow.web;

import com.adi.docflow.model.*;
import com.adi.docflow.repository.RequestDocumentRepository;
import com.adi.docflow.service.RequestService;
import com.adi.docflow.web.dto.CreateRequestDTO;
import com.adi.docflow.web.dto.DocumentDTO;
import com.adi.docflow.web.dto.OrganizationDTO;
import com.adi.docflow.web.dto.ProjectDTO;
import com.adi.docflow.web.dto.RequestResponseDTO;
import com.adi.docflow.web.dto.RequestSummaryDTO;
import com.adi.docflow.web.dto.UpdateRequestDTO;
import com.adi.docflow.web.dto.NotifyRequesterDTO; // já estava aqui

import jakarta.transaction.Transactional;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.mail.javamail.JavaMailSender;      // << novo
import org.springframework.mail.SimpleMailMessage;      // << novo

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/requests")
public class RequestController {

    private final RequestService service;
    private final RequestDocumentRepository reqDocRepo;
    private final JavaMailSender mailSender; // << novo

    public RequestController(RequestService service,
                             RequestDocumentRepository reqDocRepo,
                             JavaMailSender mailSender) { // << novo parâmetro
        this.service = service;
        this.reqDocRepo = reqDocRepo;
        this.mailSender = mailSender; // << novo
    }

    /* ------------------------ MAPEADORES DTO ------------------------ */

    private OrganizationDTO toDTO(Organization o) {
        if (o == null) return null;
        return new OrganizationDTO(
                o.getId(),
                o.getName(),
                o.getOrgType(),
                o.getQtdProjetos()
        );
    }

    private ProjectDTO toDTO(Project p) {
        if (p == null) return null;
        return new ProjectDTO(
                p.getId(),
                p.getCode(),
                p.getName(),
                p.getDescription(),
                toDTO(p.getClient())
        );
    }

    private DocumentDTO toDTO(Document d) {
        if (d == null) return null;
        return new DocumentDTO(
                d.getId(),
                d.getCode(),
                d.getTitle(),
                d.getRevision(),
                d.getProject() != null ? d.getProject().getId() : null
        );
    }

    private RequestResponseDTO toDTO(Request r) {
        List<DocumentDTO> docs = reqDocRepo.findByRequestId(r.getId()).stream()
                .map(RequestDocument::getDocument)
                .map(this::toDTO)
                .toList();

        return new RequestResponseDTO(
                r.getId(),
                r.getRequestNumber(),
                toDTO(r.getProject()),
                toDTO(r.getOrigin()),
                toDTO(r.getDestination()),
                r.getPurpose(),
                r.getDescription(),
                r.getRequesterName(),
                r.getRequesterContact(),
                r.getTargetName(),
                r.getTargetContact(),
                r.getRequestDate(),
                r.getDeadline(),
                r.getJustification(),
                r.getSpecialInstructions(),
                r.getStatus(),
                docs
        );
    }

    /* --------------------------- ENDPOINTS -------------------------- */

    /** Cria uma Request (sem protocolo; número legível é gerado). */
    @PostMapping
    public ResponseEntity<RequestResponseDTO> create(@RequestBody CreateRequestDTO dto) {
        Project project = service.requireProject(dto.getProjectId());
        Organization origin = service.requireOrg(dto.getRequesterOrgId());
        Organization destination = service.requireOrg(dto.getTargetOrgId());

        Request r = new Request();
        r.setProject(project);
        r.setOrigin(origin);
        r.setDestination(destination);

        r.setPurpose(dto.getPurpose());
        r.setDescription(dto.getDescription());

        if (dto.getRequesterUserId() != null) {
            String requesterName = service.resolveRequesterUser(dto.getRequesterUserId());
            r.setRequesterName(requesterName);
            r.setRequesterContact(dto.getRequesterContact());
        } else {
            r.setRequesterName(dto.getRequesterName());
            r.setRequesterContact(dto.getRequesterContact());
        }

        r.setTargetName(service.resolveOrgName(dto.getTargetOrgId()));
        r.setTargetContact(service.resolveOrgContact(dto.getTargetOrgId()));

        r.setRequestDate(dto.getRequestDate() != null ? dto.getRequestDate() : OffsetDateTime.now());
        r.setDeadline(dto.getDesiredDeadline());
        r.setJustification(dto.getJustification());
        r.setSpecialInstructions(dto.getSpecialInstructions());

        r.setStatus(RequestStatus.PENDING);

        Request saved = service.create(r, dto.getDocumentIds());

        return ResponseEntity
                .created(URI.create("/api/v1/requests/" + saved.getId()))
                .body(toDTO(saved));
    }

    @GetMapping("{id}")
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<RequestResponseDTO> get(@PathVariable Long id) {
        return service.get(id)
                .map(req -> ResponseEntity.ok(toDTO(req)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Listagem paginada com busca por texto e filtro de status. */
    @GetMapping
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<Page<RequestSummaryDTO>> listPaged(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "requestDate,desc") String sortParam
    ) {
        Sort sort = Sort.by(
                sortParam.contains(",")
                        ? Sort.Order.by(sortParam.split(",")[0])
                            .with(sortParam.toLowerCase().endsWith(",asc") ? Sort.Direction.ASC : Sort.Direction.DESC)
                        : Sort.Order.desc(sortParam)
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        RequestStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = RequestStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                statusEnum = null;
            }
        }

        Page<RequestSummaryDTO> result = service.list(q, statusEnum, pageable);
        return ResponseEntity.ok(result);
    }

    /** Lista completa (sem paginação) opcionalmente filtrada por status. */
    @GetMapping("/full")
    @Transactional(Transactional.TxType.SUPPORTS)
    public ResponseEntity<List<RequestResponseDTO>> listFull(
            @RequestParam(name = "status", required = false) RequestStatus status
    ) {
        List<Request> data = (status != null)
                ? service.listByStatus(status)
                : service.listAll();

        return ResponseEntity.ok(
                data.stream().map(this::toDTO).toList()
        );
    }

    /* ========================= PUT genérico ========================= */

    @PutMapping("{id}")
    @Transactional
    public ResponseEntity<RequestResponseDTO> update(
            @PathVariable Long id,
            @RequestBody UpdateRequestDTO dto
    ) {
        try {
            Request updated = service.update(id, dto);
            return ResponseEntity.ok(toDTO(updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /* ========================= PUTs de status ========================= */

    @PutMapping("{id}/status")
    @Transactional
    public ResponseEntity<RequestResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateRequestDTO body
    ) {
        if (body == null || body.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Request updated = service.updateStatus(id, body.getStatus(), body.getReason());
            return ResponseEntity.ok(toDTO(updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("{id}/approve")
    @Transactional
    public ResponseEntity<RequestResponseDTO> approve(@PathVariable Long id) {
        try {
            Request updated = service.updateStatus(id, RequestStatus.IN_PROGRESS, null);
            return ResponseEntity.ok(toDTO(updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("{id}/reject")
    @Transactional
    public ResponseEntity<RequestResponseDTO> reject(
            @PathVariable Long id,
            @RequestBody(required = false) UpdateRequestDTO body
    ) {
        String reason = (body != null) ? body.getReason() : null;
        try {
            Request updated = service.updateStatus(id, RequestStatus.REJECTED, reason);
            return ResponseEntity.ok(toDTO(updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /* =================== NOTIFICAÇÃO DO SOLICITANTE =================== */

    @PostMapping("{id}/notify-requester")
    @Transactional
    public ResponseEntity<Void> notifyRequester(
            @PathVariable Long id,
            @RequestBody NotifyRequesterDTO body
    ) {
        if (body == null || body.getMessage() == null || body.getMessage().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // reutiliza o service.get(id) que já existe
            Request req = service.get(id).orElseThrow(NoSuchElementException::new);

            String email = req.getRequesterContact(); // aqui você está guardando o e-mail do solicitante
            if (email == null || email.isBlank()) {
                // por exemplo: request foi criada sem e-mail de contato
                return ResponseEntity.badRequest().build();
            }

            String subject = "[DocScriptum] Atualização da sua solicitação";
            if (req.getRequestNumber() != null && !req.getRequestNumber().isBlank()) {
                subject += " #" + req.getRequestNumber();
            }

            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject(subject);
            msg.setText(body.getMessage());

            // Remetente será o e-mail configurado em spring.mail.username
            mailSender.send(msg);

            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // erro genérico (SMTP, etc.)
            return ResponseEntity.status(500).build();
        }
    }

    /* =================== PROTOCOLO & FINALIZAÇÃO =================== */

    /** Gera e salva o protocolo da Request caso ainda não exista. */
    @PostMapping("{id}/ensure-protocol")
    @Transactional
    public ResponseEntity<RequestResponseDTO> ensureProtocol(@PathVariable Long id) {
        try {
            Request updated = service.ensureProtocol(id);
            return ResponseEntity.ok(toDTO(updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Finaliza a Request:
     *  - garante protocolo;
     *  - move status para COMPLETED;
     *  - (se existir no modelo) define completedAt.
     */
    @PostMapping("{id}/finalize")
    @Transactional
    public ResponseEntity<RequestResponseDTO> finalizeRequest(@PathVariable Long id) {
        try {
            Request updated = service.finalizeRequest(id);
            return ResponseEntity.ok(toDTO(updated));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

}
