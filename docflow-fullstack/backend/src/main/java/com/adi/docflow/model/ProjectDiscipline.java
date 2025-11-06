// src/main/java/com/adi/docflow/model/ProjectDiscipline.java
package com.adi.docflow.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "project_discipline", schema = "app")
@Getter
@Setter
public class ProjectDiscipline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "disciplina_id")
    private Long disciplinaId;

    @Column(name = "disciplina_nome")
    private String disciplinaNome;

    // ✅ Adicione estes campos
    @Column(name = "destinatario_cliente")
    private Boolean destinatarioCliente;

    @Column(name = "destinatario_interno")
    private Boolean destinatarioInterno;
}
