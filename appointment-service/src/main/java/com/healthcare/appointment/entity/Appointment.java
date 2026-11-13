package com.healthcare.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    private String patientName;
    private String patientEmail;
    private String patientPhone;

    @Column(nullable = false)
    private Long doctorId;

    private String doctorName;
    private String doctorEmail;
    private String specialty;

    @Column(nullable = false)
    private Long slotId;

    private LocalDate appointmentDate;
    private LocalTime startTime;

    @Column(columnDefinition = "TEXT")
    private String reason;

    // Auto-generated Jitsi Meet room link for Telemedicine
    private String meetingLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    private LocalDateTime createdAt;
}