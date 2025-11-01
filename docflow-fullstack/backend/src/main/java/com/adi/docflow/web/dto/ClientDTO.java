package com.adi.docflow.web.dto;

public record ClientDTO(
    Long id,
    String name,
    String cnpj,
    String description,
    String status,
    String segment,
    String addrStreet,
    String addrNumber,
    String addrComplement,
    String addrDistrict,
    String addrZipcode,
    String addrCity,
    String addrState,
    String contactName,
    String contactRole,
    String contactEmail,
    String contactPhone,
    String contactNotes,
    Integer projectsCount
) {}
