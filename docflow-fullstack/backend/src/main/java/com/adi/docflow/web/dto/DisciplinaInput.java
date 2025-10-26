package com.adi.docflow.web.dto;

import java.util.List;

public record DisciplinaInput(
    Long disciplinaId,
    String disciplinaNome,
    String destinatarioCliente,
    String destinatarioInterno,
    List<DocTipoQtdInput> tipos
) {}
