package com.adi.docflow.web.dto;

public record MarcoContratualInput(
    String marcoContratual,
    String dataLimite,  // formato dd/MM/yyyy
    String descricao
) {}
