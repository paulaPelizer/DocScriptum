// src/main/java/com/adi/docflow/web/OrganizationController.java
package com.adi.docflow.web;

import com.adi.docflow.model.Organization;
import com.adi.docflow.model.OrgType;
import com.adi.docflow.repository.OrganizationRepository;
import com.adi.docflow.web.dto.OrganizationDTO;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orgs")
public class OrganizationController {

  private final OrganizationRepository orgRepo;

  public OrganizationController(OrganizationRepository orgRepo) {
    this.orgRepo = orgRepo;
  }

  private static OrganizationDTO toDTO(Organization o) {
    return new OrganizationDTO(o.getId(), o.getName(), o.getOrgType(),  o.getQtdProjetos());
  }

  // GET /api/v1/orgs?type=CLIENT&q=acme
  @GetMapping
  public Page<OrganizationDTO> list(
      @RequestParam(name = "type") String type,              // obrigatório
      @RequestParam(name = "q", required = false) String q,  // opcional
      @ParameterObject
      @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
  ) {
    OrgType orgType;
    try {
      orgType = OrgType.valueOf(type.toUpperCase());
    } catch (IllegalArgumentException ex) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.BAD_REQUEST,
          "Parâmetro 'type' inválido. Use CLIENT, SUPPLIER, etc."
      );
    }

    Page<Organization> page = (StringUtils.hasText(q))
        ? orgRepo.findByOrgTypeAndNameContainingIgnoreCase(orgType, q, pageable)
        : orgRepo.findByOrgType(orgType, pageable);

    return page.map(OrganizationController::toDTO);
  }

  // GET /api/v1/orgs/{id}
  @GetMapping("/{id}")
  public ResponseEntity<OrganizationDTO> get(@PathVariable Long id) {
    return orgRepo.findById(id)
        .map(o -> ResponseEntity.ok(toDTO(o)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }
}
