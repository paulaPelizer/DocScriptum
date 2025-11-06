// src/main/java/com/adi/docflow/web/dto/views/DisciplineView.java
package com.adi.docflow.model;

public interface DisciplineView {
    Long getId();      // disciplina_id
    String getCode();  // convertido de disciplina_id (ou outro critério)
    String getName();  // disciplina_nome
}
