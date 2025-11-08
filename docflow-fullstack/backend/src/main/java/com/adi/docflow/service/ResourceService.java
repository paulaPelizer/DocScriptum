package com.adi.docflow.service;

import com.adi.docflow.model.Resource;
import com.adi.docflow.repository.ResourceRepository;
import com.adi.docflow.web.dto.CreateResourceDTO;
import com.adi.docflow.web.dto.ResourceDTO;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    @Transactional
    public ResourceDTO create(CreateResourceDTO dto) {
        if (dto == null || dto.name() == null || dto.name().isBlank()) {
            throw new IllegalArgumentException("Nome é obrigatório");
        }

        Resource r = new Resource();

        r.setName(trim(dto.name()));
        r.setRole(trim(dto.role()));
        r.setEmail(trim(dto.email()));
        r.setPhone(trim(dto.phone()));

        // --- orgType → partnershipType ---
        String orgTypeRaw = dto.orgType() != null ? dto.orgType().trim().toUpperCase() : "CLIENT";
        String partnershipType = switch (orgTypeRaw) {
            case "SUPPLIER", "FORNECEDOR" -> "SUPPLIER";
            case "INTERNAL", "INTERNO"    -> "INTERNAL";
            case "CLIENT", "CLIENTE"      -> "CLIENT";
            default                       -> "CLIENT";
        };
        r.setPartnershipType(partnershipType);
        r.setPartnershipName(trim(dto.orgName()));

        // --- status ("Ativo"/"Inativo") → "ATIVO"/"INATIVO" ---
        String rawStatus = dto.status() != null ? dto.status().trim().toUpperCase() : "ATIVO";
        String normalizedStatus =
                ("INATIVO".equals(rawStatus) || "INACTIVE".equals(rawStatus))
                        ? "INATIVO"
                        : "ATIVO";
        r.setStatus(normalizedStatus);

        // --- tags → CSV ---
        if (dto.tags() != null && !dto.tags().isEmpty()) {
            r.setTags(String.join(",", dto.tags()));
        } else {
            r.setTags(null);
        }

        r.setNotes(trim(dto.notes()));

        OffsetDateTime now = OffsetDateTime.now();
        r.setCreatedAt(now);
        r.setUpdatedAt(now);

        Resource saved = resourceRepository.save(r);
        return toDTO(saved);
    }

    private ResourceDTO toDTO(Resource r) {
        List<String> tagsList;
        if (r.getTags() == null || r.getTags().isBlank()) {
            tagsList = List.of();
        } else {
            tagsList = Arrays.stream(r.getTags().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        return new ResourceDTO(
                r.getId(),
                r.getName(),
                r.getRole(),
                r.getStatus(),
                r.getEmail(),
                r.getPhone(),
                r.getPartnershipType(),
                r.getPartnershipName(),
                tagsList,
                r.getNotes()
        );
    }

    private String trim(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
