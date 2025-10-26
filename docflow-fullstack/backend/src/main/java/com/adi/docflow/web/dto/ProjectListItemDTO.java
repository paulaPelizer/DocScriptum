package com.adi.docflow.web.dto;

import java.time.Instant;

public class ProjectListItemDTO {
    private final Long id;
    private final String nome;              // Nome
    private final String cliente;           // Cliente
    private final Long documentos;          // Documentos
    private final String status;            // Status
    private final Instant ultimaAtualizacao;// Última Atualização

    public ProjectListItemDTO(Long id, String nome, String cliente, Long documentos, String status, Instant ultimaAtualizacao) {
        this.id = id;
        this.nome = nome;
        this.cliente = cliente;
        this.documentos = documentos;
        this.status = status;
        this.ultimaAtualizacao = ultimaAtualizacao;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getCliente() { return cliente; }
    public Long getDocumentos() { return documentos; }
    public String getStatus() { return status; }
    public Instant getUltimaAtualizacao() { return ultimaAtualizacao; }
}
