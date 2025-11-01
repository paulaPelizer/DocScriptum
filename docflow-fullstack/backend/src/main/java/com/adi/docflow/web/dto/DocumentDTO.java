package com.adi.docflow.web.dto;

public record DocumentDTO(
        Long id,
        String code,
        String title,
        String revision,
        Long projectId,
        String status,
        String type,
        String milestone,
        String fileName,
        String lastModified,
        String uploadedBy
) {
    public DocumentDTO(Long id, String code, String title, String revision, Long projectId) {
        this(id, code, title, revision, projectId,
             null, null, null, null, null, null);
    }
}
