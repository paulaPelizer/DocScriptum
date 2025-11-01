// src/main/java/com/adi/docflow/repository/OrganizationRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.Organization;
import com.adi.docflow.model.OrgType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Page<Organization> findByOrgType(OrgType type, Pageable pageable);
    Page<Organization> findByOrgTypeAndNameContainingIgnoreCase(OrgType type, String name, Pageable pageable);
}
