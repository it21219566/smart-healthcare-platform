package com.healthcare.doctor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String specialty; // e.g., Cardiologist, Dermatologist, General Physician

    private String qualification;
    private String slmcRegNumber; // Sri Lanka Medical Council Registration No
    private Double consultationFee;

    @Builder.Default
    private boolean verified = false; // Verified by ADMIN
}