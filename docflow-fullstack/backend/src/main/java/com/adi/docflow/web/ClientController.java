// src/main/java/com/adi/docflow/web/ClientController.java
package com.adi.docflow.web;

import com.adi.docflow.model.OrgType;
import com.adi.docflow.model.Organization;
import com.adi.docflow.repository.OrganizationRepository;
import com.adi.docflow.web.dto.ClientCreateDTO;
import com.adi.docflow.web.dto.ClientDTO;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clients")
public class ClientController {

    private final OrganizationRepository orgRepo;

    public ClientController(OrganizationRepository orgRepo) {
        this.orgRepo = orgRepo;
    }

    // ---------- Mapping helpers ----------

    private static ClientDTO toDTO(Organization o) {
        return new ClientDTO(
            o.getId(),
            // empresa
            o.getName(),
            o.getCnpj(),
            o.getDescription(),
            o.getStatus(),
            o.getSegment(),
            // endereço
            o.getAddrStreet(),
            o.getAddrNumber(),
            o.getAddrComplement(),
            o.getAddrDistrict(),
            o.getAddrZipcode(),
            o.getAddrCity(),
            o.getAddrState(),
            // contato
            o.getContactName(),
            o.getContactRole(),
            o.getContactEmail(),
            o.getContactPhone(),
            o.getContactNotes(),
            o.getQtdProjetos()
        );
    }

    private static void applyCreateDTO(Organization o, ClientCreateDTO b) {
        // empresa
        o.setName(b.name());
        o.setCnpj(b.cnpj());
        o.setDescription(b.description());
        o.setStatus(b.status());
        o.setSegment(b.segment());

        // endereço
        o.setAddrStreet(b.addrStreet());
        o.setAddrNumber(b.addrNumber());
        o.setAddrComplement(b.addrComplement());
        o.setAddrDistrict(b.addrDistrict());
        o.setAddrZipcode(b.addrZipcode());
        o.setAddrCity(b.addrCity());
        o.setAddrState(b.addrState());

        // contato
        o.setContactName(b.contactName());
        o.setContactRole(b.contactRole());
        o.setContactEmail(b.contactEmail());
        o.setContactPhone(b.contactPhone());
        o.setContactNotes(b.contactNotes());

    }

    // ---------- Endpoints ----------

    // GET /api/v1/clients?q=... (paginado)
    @GetMapping
    @PreAuthorize("permitAll()")
    public Page<ClientDTO> list(
        @RequestParam(required = false) String q,
        @ParameterObject
        @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        if (StringUtils.hasText(q)) {
            return orgRepo
                .findByOrgTypeAndNameContainingIgnoreCase(OrgType.CLIENT, q, pageable)
                .map(ClientController::toDTO);
        }
        return orgRepo.findByOrgType(OrgType.CLIENT, pageable).map(ClientController::toDTO);
    }

    // GET /api/v1/clients/{id}
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ClientDTO> get(@PathVariable Long id) {
        return orgRepo.findById(id)
            .filter(o -> o.getOrgType() == OrgType.CLIENT)
            .map(o -> ResponseEntity.ok(toDTO(o)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // POST /api/v1/clients
    @PostMapping
    @PreAuthorize("permitAll()") // liberar criação via Swagger/front sem token
    public ResponseEntity<ClientDTO> create(@Valid @RequestBody ClientCreateDTO body) {
        Organization o = new Organization();
        o.setOrgType(OrgType.CLIENT);
        applyCreateDTO(o, body);

        Organization saved = orgRepo.save(o);
        return ResponseEntity.ok(toDTO(saved));
    }

    // Opcional: sanity check
    @GetMapping("/_ping")
    @PreAuthorize("permitAll()")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("pong");
    }
}
