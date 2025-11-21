package com.adi.docflow.web.dto;

import java.time.Instant;

public class ProjectListItemDTO {

    private final Long id;
    private final String codigo;            // opcional, se quiser usar depois
    private final String nome;             // Nome do projeto
    private final String cliente;          // Nome do cliente
    private final Long documentos;         // Quantidade de documentos
    private final String status;           // Status
    private final Instant ultimaAtualizacao; // Última atualização

    // ESTE construtor PRECISA bater com a JPQL:
    //
    // new ProjectListItemDTO(
    //    p.id,
    //    p.code,
    //    p.name,
    //    coalesce(c.name, ''),
    //    coalesce(sum(dt.quantity), 0),
    //    p.status,
    //    p.updatedAt
    // )
    public ProjectListItemDTO(
            Long id,
            String code,
            String name,
            String clientName,
            Long documentsCount,
            String status,
            Instant updatedAt
    ) {
        this.id = id;
        this.codigo = code;           // se não quiser usar, tudo bem
        this.nome = name;
        this.cliente = clientName;
        this.documentos = documentsCount;
        this.status = status;
        this.ultimaAtualizacao = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNome() {
        return nome;
    }

    public String getCliente() {
        return cliente;
    }

    public Long getDocumentos() {
        return documentos;
    }

    public String getStatus() {
        return status;
    }

    public Instant getUltimaAtualizacao() {
        return ultimaAtualizacao;
    }
}
