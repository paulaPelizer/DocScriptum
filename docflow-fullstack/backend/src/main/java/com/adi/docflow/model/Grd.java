package com.adi.docflow.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "grd",
    schema = "app",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_grd_number", columnNames = "number"),
        @UniqueConstraint(name = "uq_grd_protocol", columnNames = "protocol")
    }
)
public class Grd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** vínculo com a Request que originou a GRD */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_grd_request"))
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id",
            foreignKey = @ForeignKey(name = "fk_grd_project"))
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_id",
            foreignKey = @ForeignKey(name = "fk_grd_origin"))
    private Organization origin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_id",
            foreignKey = @ForeignKey(name = "fk_grd_destination"))
    private Organization destination;

    /** identificadores humanos (únicos) */
    @Column(name = "number", length = 40, nullable = false)
    private String number;

    @Column(name = "protocol", length = 40, nullable = false)
    private String protocol;

    /** dados descritivos */
    @Column(name = "purpose", length = 500)
    private String purpose;

    @Column(name = "delivery_method", length = 120)
    private String deliveryMethod;

    @Column(name = "observations", length = 2000)
    private String observations;

    /** emissão/assinatura */
    @Column(name = "emitted_by", length = 180)
    private String emittedBy;

    @Column(name = "emission_at")
    private OffsetDateTime emissionAt;

    /** status textual da GRD (ex.: EMITIDA) */
    @Column(name = "status", length = 40)
    private String status;
}
