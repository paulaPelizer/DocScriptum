package com.adi.docflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "app_user", schema = "app")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String username;

    @Column(nullable = false, length = 200)
    private String password;

    @Column(nullable = false)
    private boolean enabled = true;

    // <<< NOVO: coluna de perfis (DBA,ADMIN,RESOURCE etc.) >>>
    @Column(name = "roles", length = 200)
    private String roles; // ex.: "DBA,ADMIN" ou "RESOURCE"

    @Column(name = "email", nullable = true, unique = true, length = 255)
    private String email;


    // ============ getters / setters ============

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    /** String bruta de roles, separadas por vírgula (DBA,ADMIN,RESOURCE). */
    public String getRoles() {
        return roles;
    }

    public void setRoles(String roles) {
        this.roles = roles;
    }

     public String getEmail() {
    return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
  
}
