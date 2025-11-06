package com.adi.docflow.repository;

import com.adi.docflow.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectBasicRepository extends JpaRepository<Project, Long> {
    // nada extra aqui — só o CRUD básico
}
