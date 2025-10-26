// src/main/java/com/adi/docflow/model/AppUser.java
package com.adi.docflow.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "app_user", schema = "app")
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="username", nullable=false, unique=true)
    private String username;

    @Column(name="password", nullable=false)
    private String password;

    @Column(name="enabled", nullable=false)
    private boolean enabled = true;

    // getters/setters...
}
