package com.adi.docflow.web.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocTypeDTO {
    private Long id;
    private String code;
    private String name;
    private Long disciplineId; // vínculo com a disciplina (quando existir)
}
