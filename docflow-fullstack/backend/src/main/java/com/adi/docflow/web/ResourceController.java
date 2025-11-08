// src/main/java/com/adi/docflow/web/ResourceController.java
package com.adi.docflow.web;

import com.adi.docflow.model.Resource;
import com.adi.docflow.repository.ResourceRepository;
import com.adi.docflow.web.dto.ResourceSummaryDTO;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceRepository resourceRepository;

    /* =======================================================================
     *  DTO de entrada (serve para CREATE e UPDATE)
     * ======================================================================= */
    public record UpsertResourceBody(
            String name,
            String role,
            String email,
            String phone,

            // usados nos testes via Swagger
            String orgType,
            String orgName,

            // usados hoje no front (ResourceNewPage)
            String partnershipType,
            String partnershipName,

            String status,          // "Ativo" / "Inativo" ou "ATIVO" / "INATIVO"
            List<String> tags,
            String notes
    ) {}

    /* =======================================================================
     *  LISTAR TODOS  (GET /api/v1/resources)
     * ======================================================================= */

    @GetMapping
    public ResponseEntity<List<ResourceSummaryDTO>> list() {
        List<Resource> all = resourceRepository.findAll();

        List<ResourceSummaryDTO> dtos = all.stream()
                .map(this::toSummaryDTO)
                .toList();

        return ResponseEntity.ok(dtos);
    }

    /* =======================================================================
     *  BUSCAR POR ID  (GET /api/v1/resources/{id})
     * ======================================================================= */

    @GetMapping("/{id}")
    public ResponseEntity<ResourceSummaryDTO> getOne(@PathVariable Long id) {
        return resourceRepository.findById(id)
                .map(this::toSummaryDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* =======================================================================
     *  CRIAR  (POST /api/v1/resources)
     * ======================================================================= */

    @PostMapping
    public ResponseEntity<ResourceSummaryDTO> create(@RequestBody UpsertResourceBody body) {
        Resource r = new Resource();

        applyBodyToEntity(r, body);

        OffsetDateTime now = OffsetDateTime.now();
        r.setCreatedAt(now);
        r.setUpdatedAt(now);

        Resource saved = resourceRepository.save(r);
        return ResponseEntity.ok(toSummaryDTO(saved));
    }

    /* =======================================================================
     *  ATUALIZAR  (PUT /api/v1/resources/{id})
     * ======================================================================= */

    @PutMapping("/{id}")
    public ResponseEntity<ResourceSummaryDTO> update(
            @PathVariable Long id,
            @RequestBody UpsertResourceBody body
    ) {
        return resourceRepository.findById(id)
                .map(existing -> {
                    applyBodyToEntity(existing, body);
                    existing.setUpdatedAt(OffsetDateTime.now());
                    Resource saved = resourceRepository.save(existing);
                    return ResponseEntity.ok(toSummaryDTO(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /* =======================================================================
     *  Helpers de mapeamento
     * ======================================================================= */

    /** Aplica os campos do body na entidade Resource (tanto para create quanto update). */
    private void applyBodyToEntity(Resource r, UpsertResourceBody body) {

        // básicos
        r.setName(trimOrNull(body.name()));
        r.setRole(trimOrNull(body.role()));
        r.setEmail(trimOrNull(body.email()));
        r.setPhone(trimOrNull(body.phone()));

        // -------- orgType / partnershipType => String canônica ("CLIENT"/"SUPPLIER"/"INTERNAL")
        String rawType = null;

        if (body.orgType() != null && !body.orgType().isBlank()) {
            rawType = body.orgType().trim().toUpperCase();
        } else if (body.partnershipType() != null && !body.partnershipType().isBlank()) {
            rawType = body.partnershipType().trim().toUpperCase();
        }

        if (rawType == null) {
            rawType = "CLIENT";
        }

        String partnershipType = switch (rawType) {
            case "SUPPLIER", "FORNECEDOR" -> "SUPPLIER";
            case "INTERNAL", "INTERNO"   -> "INTERNAL";
            case "CLIENT", "CLIENTE"     -> "CLIENT";
            default                      -> "CLIENT";
        };
        r.setPartnershipType(partnershipType);

        // nome da parceria: tenta orgName depois partnershipName
        String partnershipName = null;
        if (body.orgName() != null && !body.orgName().isBlank()) {
            partnershipName = body.orgName().trim();
        } else if (body.partnershipName() != null && !body.partnershipName().isBlank()) {
            partnershipName = body.partnershipName().trim();
        }
        r.setPartnershipName(partnershipName);

        // -------- status UI ("Ativo"/"Inativo") -> "ATIVO"/"INATIVO" --------
        String st = body.status() != null ? body.status().trim().toUpperCase() : "ATIVO";
        String status = "INATIVO".equals(st) ? "INATIVO" : "ATIVO";
        r.setStatus(status);

        // tags list -> CSV
        if (body.tags() != null && !body.tags().isEmpty()) {
            String joined = String.join(",",
                    body.tags().stream()
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .toList()
            );
            r.setTags(joined);
        } else {
            r.setTags(null);
        }

        r.setNotes(trimOrNull(body.notes()));
    }

    private String trimOrNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    /* monta DTO de saída para list/get/create/update */
    private ResourceSummaryDTO toSummaryDTO(Resource r) {
        return new ResourceSummaryDTO(
                r.getId(),
                r.getName(),
                r.getRole(),
                r.getEmail(),
                r.getPhone(),
                r.getPartnershipType(),   // "CLIENT" / "SUPPLIER" / "INTERNAL"
                r.getPartnershipName(),
                r.getStatus(),            // "ATIVO" / "INATIVO"
                splitTags(r.getTags()),
                r.getNotes()
        );
    }

    /* Helpers de tags */
    private List<String> splitTags(String csv) {
        if (csv == null || csv.isBlank()) return Collections.emptyList();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
