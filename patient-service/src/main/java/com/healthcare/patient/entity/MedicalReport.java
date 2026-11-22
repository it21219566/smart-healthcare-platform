package com.healthcare.patient.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    private Long appointmentId;

    private String reportName;
    private String fileType;
    private String filePath;
    private String description;
    private LocalDateTime uploadedAt;
}