package com.healthcare.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentEvent {
    private Long appointmentId;
    private String eventType;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String doctorName;
    private String doctorEmail;
    private String appointmentDate;
    private String startTime;
    private String meetingLink;
}