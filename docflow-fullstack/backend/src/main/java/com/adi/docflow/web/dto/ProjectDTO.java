package com.adi.docflow.web.dto;

public record ProjectDTO(
        Long id,
        String code,
        String name,
        String description,
        OrganizationDTO client
) {}
