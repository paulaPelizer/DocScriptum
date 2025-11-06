// src/main/java/com/adi/docflow/service/RequestService.java
package com.adi.docflow.service;

import com.adi.docflow.model.Document;
import com.adi.docflow.model.Organization;
import com.adi.docflow.model.Project;
import com.adi.docflow.model.Request;
import com.adi.docflow.model.RequestDocument;
import com.adi.docflow.model.RequestStatus;
import com.adi.docflow.repository.DocumentRepository;
import com.adi.docflow.repository.OrganizationRepository;
import com.adi.docflow.repository.ProjectRepository;
import com.adi.docflow.repository.RequestDocumentRepository;
import com.adi.docflow.repository.RequestRepository;
import com.adi.docflow.web.dto.UpdateRequestDTO;
import com.adi.docflow.web.dto.RequestSummaryDTO;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class RequestService {

    private final RequestRepository requestRepo;
    private final ProjectRepository projectRepo;
    private final OrganizationRepository orgRepo;
    private final DocumentRepository docRepo;
    private final RequestDocumentRepository reqDocRepo;
    /*private final EmailService emailService; // << novo*/

    private final Random rnd = new Random();

    public RequestService(RequestRepository requestRepo,
                          ProjectRepository projectRepo,
                          OrganizationRepository orgRepo,
                          DocumentRepository docRepo,
                          RequestDocumentRepository reqDocRepo) {
                          /*EmailService emailService) { // << injeta EmailService*/
        this.requestRepo = requestRepo;
        this.projectRepo = projectRepo;
        this.orgRepo = orgRepo;
        this.docRepo = docRepo;
        this.reqDocRepo = reqDocRepo;
        /*this.emailService = emailService;*/
    }

    /* ===================== Lookups obrigatórios ===================== */

    public Project requireProject(Long id) {
        return projectRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("projectId " + id + " não encontrado"));
    }

    public Organization requireOrg(Long id) {
        return orgRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("organizationId " + id + " não encontrado"));
    }

    /* ===================== Helpers usados no Controller ===================== */

    public String resolveRequesterUser(Long userId) {
        if (userId == null) return "Solicitante não informado";
        return "Usuário #" + userId;
    }

    public String resolveOrgName(Long orgId) {
        if (orgId == null) return "Organização não informada";
        return orgRepo.findById(orgId)
                .map(Organization::getName)
                .orElse("Org #" + orgId + " não encontrada");
    }

    public String resolveOrgContact(Long orgId) {
        if (orgId == null) return "";
        return orgRepo.findById(orgId)
                .map(Organization::getContactEmail)
                .orElse("");
    }

    /* ===================== Identificadores ===================== */

    /** Número legível para a request (não precisa ser único rigidamente). */
    private String nextRequestNumber() {
        return "REQ-" + java.time.Year.now() + "-" +
                UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    /** Protocolo único da request (garantido via repository). */
    private String generateUniqueRequestProtocol() {
        int year = OffsetDateTime.now().getYear();
        String p;
        int tries = 0;
        do {
            int seq = 100000 + rnd.nextInt(900000);
            p = "REQ-" + year + "-" + seq;
        } while (requestRepo.existsByProtocol(p) && ++tries < 20);
        return p;
    }

    /* ===================== CRUD/Fluxo principal ===================== */

    @Transactional
    public Request create(Request req, List<Long> documentIds) {
        if (req.getRequestNumber() == null || req.getRequestNumber().isBlank()) {
            req.setRequestNumber(nextRequestNumber());
        }
        OffsetDateTime now = OffsetDateTime.now();
        req.setCreatedAt(now);
        req.setUpdatedAt(now);

        Request saved = requestRepo.save(req);

        // Vinculação de documentos (reativada)
        if (documentIds != null && !documentIds.isEmpty()) {
            bindDocuments(saved, documentIds);
        }

        return saved;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public Optional<Request> get(Long id) {
        return requestRepo.findById(id);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<Request> listByStatus(RequestStatus status) {
        return requestRepo.findTop50ByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public List<Request> listAll() {
        return requestRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    /* =============== listagem paginada com busca/filtro =============== */

    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<RequestSummaryDTO> list(String q, RequestStatus status, Pageable pageable) {
        String qNorm = (q == null || q.isBlank()) ? null : q.trim();
        return requestRepo.findSummaries(qNorm, status, pageable);
    }

    /* =============== Update genérico =============== */

    @Transactional
    public Request update(Long id, UpdateRequestDTO body) {
        Request r = requestRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("requestId " + id + " não encontrado"));

        boolean touched = false;
        OffsetDateTime now = OffsetDateTime.now();

        if (body.getProjectId() != null) {
            Project p = requireProject(body.getProjectId());
            r.setProject(p);
            touched = true;
        }
        if (body.getRequesterOrgId() != null) {
            Organization org = requireOrg(body.getRequesterOrgId());
            r.setOrigin(org);
            touched = true;
        }
        if (body.getTargetOrgId() != null) {
            Organization org = requireOrg(body.getTargetOrgId());
            r.setDestination(org);
            touched = true;
        }

        if (body.getPurpose() != null) { r.setPurpose(body.getPurpose()); touched = true; }
        if (body.getDescription() != null) { r.setDescription(body.getDescription()); touched = true; }
        if (body.getRequesterName() != null) { r.setRequesterName(body.getRequesterName()); touched = true; }
        if (body.getRequesterContact() != null) { r.setRequesterContact(body.getRequesterContact()); touched = true; }
        if (body.getTargetName() != null) { r.setTargetName(body.getTargetName()); touched = true; }
        if (body.getTargetContact() != null) { r.setTargetContact(body.getTargetContact()); touched = true; }
        if (body.getRequestDate() != null) { r.setRequestDate(body.getRequestDate()); touched = true; }
        if (body.getDesiredDeadline() != null) { r.setDeadline(body.getDesiredDeadline()); touched = true; }
        if (body.getJustification() != null) { r.setJustification(body.getJustification()); touched = true; }
        if (body.getSpecialInstructions() != null) { r.setSpecialInstructions(body.getSpecialInstructions()); touched = true; }
        if (body.getStatus() != null) { r.setStatus(body.getStatus()); touched = true; }

        // Documentos ainda mantidos desativados no update para evitar duplicações,
        // mas você pode reativar quando quiser:
        // if (body.getDocumentIds() != null) {
        //     bindDocuments(r, body.getDocumentIds());
        //     touched = true;
        // }

        if (touched) {
            r.setUpdatedAt(now);
            r = requestRepo.save(r);
        }
        return r;
    }

    /* =============== Notificação do solicitante por e-mail =============== */

    /*@Transactional
    public void notifyRequester(Long requestId, String message) {
        Request r = requestRepo.findById(requestId)
                .orElseThrow(() -> new NoSuchElementException("requestId " + requestId + " não encontrado"));

        String to = (r.getRequesterContact() != null) ? r.getRequesterContact().trim() : "";
        if (to.isBlank() && r.getOrigin() != null && r.getOrigin().getContactEmail() != null) {
            to = r.getOrigin().getContactEmail().trim();
        }

        if (to.isBlank()) {
            throw new IllegalStateException(
                    "Solicitação " + requestId + " não possui e-mail de contato do solicitante (requester_contact/origin.contactEmail)."
            );
        }

        String subject = "Pendências de documentos - Solicitação " + r.getRequestNumber();
        String body = message;

        // Se quiser enriquecer:
        // String nome = (r.getRequesterName() != null && !r.getRequesterName().isBlank())
        //         ? r.getRequesterName().trim() : "solicitante";
        // body = "Prezado(a) " + nome + ",\n\n" + message + "\n\nAtenciosamente,\nEquipe DocFlow";

        emailService.send(to, subject, body);
    }

    /* =============== Protocolo e finalização =============== */

    /** Garante que a Request possua um protocolo; gera e salva se estiver ausente. */
    @Transactional
    public Request ensureProtocol(Long requestId) {
        Request r = requestRepo.findById(requestId)
                .orElseThrow(() -> new NoSuchElementException("requestId " + requestId + " não encontrado"));

        if (r.getProtocol() == null || r.getProtocol().isBlank()) {
            r.setProtocol(generateUniqueRequestProtocol());
            r.setUpdatedAt(OffsetDateTime.now());
            r = requestRepo.save(r);
        }
        return r;
    }

    /**
     * Finaliza a Request:
     *  - garante protocolo;
     *  - move status para COMPLETED;
     *  - opcionalmente carimba completedAt caso o campo exista no modelo.
     */
    @Transactional
    public Request finalizeRequest(Long requestId) {
        Request r = ensureProtocol(requestId);
        r.setStatus(RequestStatus.COMPLETED);
        r.setUpdatedAt(OffsetDateTime.now());

        // Se existir o campo completedAt no modelo, define via reflexão sem quebrar o build se não existir.
        try {
            Field f = Request.class.getDeclaredField("completedAt");
            f.setAccessible(true);
            if (f.get(r) == null) {
                f.set(r, OffsetDateTime.now());
            }
        } catch (NoSuchFieldException ignored) {
            // ok: campo não existe no seu modelo atual
        } catch (IllegalAccessException e) {
            throw new RuntimeException("Falha ao definir completedAt", e);
        }

        return requestRepo.save(r);
    }

    /* =============== Atualização de status (atalhos e genérico) =============== */

    @Transactional
    public Request updateStatus(Long id, RequestStatus newStatus, String reason) {
        Request r = requestRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("requestId " + id + " não encontrado"));

        r.setStatus(newStatus);
        r.setUpdatedAt(OffsetDateTime.now());
        // opcional: persistir reason em log/campo
        return requestRepo.save(r);
    }

    /* =============== Vincular documentos =============== */

    private void bindDocuments(Request saved, List<Long> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) return;

        List<Document> docs = docRepo.findAllById(documentIds);

        Set<Long> encontrados = new HashSet<>();
        for (Document d : docs) encontrados.add(d.getId());
        Set<Long> solicitados = new HashSet<>(documentIds);
        solicitados.removeAll(encontrados);
        if (!solicitados.isEmpty()) {
            throw new IllegalArgumentException("documentIds inexistentes: " + solicitados);
        }

        for (Document d : docs) {
            if (d.getProject() == null || !d.getProject().getId().equals(saved.getProject().getId())) {
                throw new IllegalArgumentException(
                        "documentId " + d.getId() +
                        " não pertence ao projectId " + saved.getProject().getId()
                );
            }
            RequestDocument rd = new RequestDocument();
            rd.setRequest(saved);
            rd.setDocument(d);
            rd.setRequired(false); // ajuste conforme sua regra
            reqDocRepo.save(rd);
        }
    }
}
