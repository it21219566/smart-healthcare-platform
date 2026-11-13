package com.healthcare.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentEvent {
    private Long appointmentId;
    private String eventType; // BOOKED, CONFIRMED, CANCELLED, COMPLETED
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String doctorName;
    private String doctorEmail;
    private String appointmentDate;
    private String startTime;
    private String meetingLink;
}