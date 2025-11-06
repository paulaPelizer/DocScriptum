package com.adi.docflow.model;
public interface DocTypeView {
    Long getId();            // id do project_discipline_doc_type
    String getCode();        // doc_type
    String getName();        // doc_type
    Long getDisciplineId();  // FK para project_discipline
}