package com.adi.docflow.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO principal de leitura de Projeto.
 * Mantém compatibilidade com contratos existentes e adiciona campos úteis para a tela de detalhes.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectGetDTO {

    private Long id;
    private String code;
    private String name;

    /** Identificador do cliente (mantido para compatibilidade) */
    private Long clientId;

    /** Nome do cliente (novo - facilita exibição no frontend) */
    private String clientName;

    private String description;

    /** Status inicial (mantido) */
    private String statusInicial;

    /** Alias de status para simplificar o frontend (retorna statusInicial) */
    public String getStatus() {
        return statusInicial;
    }

    /** Datas no formato dd/MM/yyyy (mantido) */
    private String dataInicio;              // dd/MM/yyyy
    private String dataPrevistaConclusao;   // dd/MM/yyyy

    private java.util.List<DisciplinaDTO> disciplinas;
    private java.util.List<MarcoDTO> marcos;

    // ----------------------------------------------------
    // Getters/Setters principais
    // ----------------------------------------------------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatusInicial() { return statusInicial; }
    public void setStatusInicial(String statusInicial) { this.statusInicial = statusInicial; }

    public String getDataInicio() { return dataInicio; }
    public void setDataInicio(String dataInicio) { this.dataInicio = dataInicio; }

    public String getDataPrevistaConclusao() { return dataPrevistaConclusao; }
    public void setDataPrevistaConclusao(String dataPrevistaConclusao) { this.dataPrevistaConclusao = dataPrevistaConclusao; }

    public java.util.List<DisciplinaDTO> getDisciplinas() { return disciplinas; }
    public void setDisciplinas(java.util.List<DisciplinaDTO> disciplinas) { this.disciplinas = disciplinas; }

    public java.util.List<MarcoDTO> getMarcos() { return marcos; }
    public void setMarcos(java.util.List<MarcoDTO> marcos) { this.marcos = marcos; }

    // ----------------------------------------------------
    // Inner DTOs (mantidos)
    // ----------------------------------------------------
    public static class DisciplinaDTO {
        private Long disciplinaId;
        private String disciplinaNome;
        private String destinatarioCliente;   // "Nome <email>, ..."
        private String destinatarioInterno;
        private java.util.List<TipoDTO> tipos;

        public Long getDisciplinaId() { return disciplinaId; }
        public void setDisciplinaId(Long disciplinaId) { this.disciplinaId = disciplinaId; }

        public String getDisciplinaNome() { return disciplinaNome; }
        public void setDisciplinaNome(String disciplinaNome) { this.disciplinaNome = disciplinaNome; }

        public String getDestinatarioCliente() { return destinatarioCliente; }
        public void setDestinatarioCliente(String destinatarioCliente) { this.destinatarioCliente = destinatarioCliente; }

        public String getDestinatarioInterno() { return destinatarioInterno; }
        public void setDestinatarioInterno(String destinatarioInterno) { this.destinatarioInterno = destinatarioInterno; }

        public java.util.List<TipoDTO> getTipos() { return tipos; }
        public void setTipos(java.util.List<TipoDTO> tipos) { this.tipos = tipos; }
    }

    public static class TipoDTO {
        private String tipo;
        private Integer quantidade;

        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }

        public Integer getQuantidade() { return quantidade; }
        public void setQuantidade(Integer quantidade) { this.quantidade = quantidade; }
    }

    public static class MarcoDTO {
        private Long id;
        private String marcoContratual;
        private String descricao;
        private String dataLimite; // dd/MM/yyyy

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getMarcoContratual() { return marcoContratual; }
        public void setMarcoContratual(String marcoContratual) { this.marcoContratual = marcoContratual; }

        public String getDescricao() { return descricao; }
        public void setDescricao(String descricao) { this.descricao = descricao; }

        public String getDataLimite() { return dataLimite; }
        public void setDataLimite(String dataLimite) { this.dataLimite = dataLimite; }
    }
}
