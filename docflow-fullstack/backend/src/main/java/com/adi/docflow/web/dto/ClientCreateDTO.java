package com.adi.docflow.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientCreateDTO(
    // Empresa
    @NotBlank @Size(max = 180) String name,
    @Size(max = 20)  String cnpj,
    @Size(max = 255) String description,
    @Size(max = 40)  String status,     // "Ativo" / "Inativo"
    @Size(max = 80)  String segment,

    // Endereço
    String addrStreet,
    String addrNumber,
    String addrComplement,
    String addrDistrict,
    String addrZipcode,
    String addrCity,
    String addrState,

    // Contato principal
    String contactName,
    String contactRole,
    @Email @Size(max = 180) String contactEmail,
    String contactPhone,
    String contactNotes
) {}
