package com.adi.docflow.web.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DisciplineDTO {
    private Long id;
    private String code;
    private String name;
}
