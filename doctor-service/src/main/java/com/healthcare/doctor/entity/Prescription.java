package com.healthcare.doctor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private Long patientId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String diagnosis;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String medications; // JSON or formatted medication instructions

    private String notes;
    private LocalDateTime issuedAt;
}