package com.adi.docflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "organization", schema = "app")
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=180)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name="org_type", nullable=false, length=20)
    private OrgType orgType;

    @Column(length=18)
    private String cnpj;

    // -------- fonte de verdade --------
    @Column(length=500)
    private String description;

    @Column(length=30)
    private String status;

    @Column(length=60)
    private String segment;

    @Column(name="addr_street", length=180)
    private String addrStreet;

    @Column(name="addr_number", length=20)
    private String addrNumber;

    @Column(name="addr_complement", length=80)
    private String addrComplement;

    @Column(name="addr_district", length=80)
    private String addrDistrict;

    @Column(name="addr_zipcode", length=9)
    private String addrZipcode;

    @Column(name="addr_city", length=80)
    private String addrCity;

    @Column(name="addr_state", length=2)
    private String addrState;

    @Column(name="contact_name", length=120)
    private String contactName;

    @Column(name="contact_role", length=80)
    private String contactRole;

    @Column(name="contact_email", length=120)
    private String contactEmail;

    @Column(name="contact_phone", length=40)
    private String contactPhone;

    @Column(name="contact_notes", length=1000)
    private String contactNotes;
    
    @Column(name = "qtd_projetos")
    private Integer qtdProjetos = 0;

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public OrgType getOrgType() { return orgType; }
    public void setOrgType(OrgType orgType) { this.orgType = orgType; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public String getAddrStreet() { return addrStreet; }
    public void setAddrStreet(String addrStreet) { this.addrStreet = addrStreet; }
    public String getAddrNumber() { return addrNumber; }
    public void setAddrNumber(String addrNumber) { this.addrNumber = addrNumber; }
    public String getAddrComplement() { return addrComplement; }
    public void setAddrComplement(String addrComplement) { this.addrComplement = addrComplement; }
    public String getAddrDistrict() { return addrDistrict; }
    public void setAddrDistrict(String addrDistrict) { this.addrDistrict = addrDistrict; }
    public String getAddrZipcode() { return addrZipcode; }
    public void setAddrZipcode(String addrZipcode) { this.addrZipcode = addrZipcode; }
    public String getAddrCity() { return addrCity; }
    public void setAddrCity(String addrCity) { this.addrCity = addrCity; }
    public String getAddrState() { return addrState; }
    public void setAddrState(String addrState) { this.addrState = addrState; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getContactRole() { return contactRole; }
    public void setContactRole(String contactRole) { this.contactRole = contactRole; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getContactNotes() { return contactNotes; }
    public void setContactNotes(String contactNotes) { this.contactNotes = contactNotes; }
    public Integer getQtdProjetos() { return qtdProjetos;}
    public void setQtdProjetos(Integer qtdProjetos) { this.qtdProjetos = qtdProjetos;}
}
