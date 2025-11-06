package com.adi.docflow.repository;

import com.adi.docflow.model.Grd;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GrdRepository extends JpaRepository<Grd, Long> {
    boolean existsByNumber(String number);
    boolean existsByProtocol(String protocol);
    Optional<Grd> findByProtocol(String protocol);
}
