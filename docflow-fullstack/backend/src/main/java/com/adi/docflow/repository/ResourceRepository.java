// src/main/java/com/adi/docflow/repository/ResourceRepository.java
package com.adi.docflow.repository;

import com.adi.docflow.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
}
