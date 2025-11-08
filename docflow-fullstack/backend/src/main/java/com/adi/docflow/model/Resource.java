// src/main/java/com/adi/docflow/model/Resource.java
package com.adi.docflow.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "resource", schema = "app")
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "role", length = 200)
    private String role;

    @Column(name = "status", length = 30)
    private String status; // "ATIVO", "INATIVO", etc.

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "partnership_type", length = 50)
    private String partnershipType;   // Cliente, Fornecedor...

    @Column(name = "partnership_name", length = 200)
    private String partnershipName;   // Nome da parceria (cliente)

    @Column(name = "tags", length = 500)
    private String tags;              // guardado como "tag1,tag2,tag3"

    @Column(name = "notes")
    private String notes;             // observações

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    


    // ===== getters / setters =====

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPartnershipType() { return partnershipType; }
    public void setPartnershipType(String partnershipType) { this.partnershipType = partnershipType; }

    public String getPartnershipName() { return partnershipName; }
    public void setPartnershipName(String partnershipName) { this.partnershipName = partnershipName; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    
}
