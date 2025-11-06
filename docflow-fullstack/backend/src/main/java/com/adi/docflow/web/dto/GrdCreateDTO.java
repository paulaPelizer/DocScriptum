package com.adi.docflow.web.dto;

import lombok.Data;

@Data
public class GrdCreateDTO {
    private long requestId;        // obrigatório
    private String deliveryMethod; // ex.: "Entrega Pessoal"
    private String observations;   // opcional
    private String purpose;        // se null/blank, usa o da Request
    // number/protocol são gerados no servidor
}
