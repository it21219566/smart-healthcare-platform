package com.healthcare.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.notification.dto.AppointmentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final EmailService emailService;
    private final SmsService smsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @JmsListener(destination = "appointment.notification.queue")
    public void consumeAppointmentEvent(String messageJson) {
        try {
            AppointmentEvent event = objectMapper.readValue(messageJson, AppointmentEvent.class);

            String subject = String.format("Smart Healthcare - Appointment %s (#%d)",
                    event.getEventType(), event.getAppointmentId());

            String patientBody = String.format(
                    "Dear %s,\n\nYour telemedicine appointment with %s on %s at %s is now %s.\n" +
                    "Video Consultation Link: %s\n\nThank you,\nSmart Healthcare Platform",
                    event.getPatientName(),
                    event.getDoctorName(),
                    event.getAppointmentDate(),
                    event.getStartTime(),
                    event.getEventType(),
                    event.getMeetingLink()
            );

            String doctorBody = String.format(
                    "Doctor Notification: Appointment #%d with %s on %s at %s is %s.\nVideo Link: %s",
                    event.getAppointmentId(),
                    event.getPatientName(),
                    event.getAppointmentDate(),
                    event.getStartTime(),
                    event.getEventType(),
                    event.getMeetingLink()
            );

            String smsText = String.format(
                    "SmartHealth: Appt #%d with %s on %s at %s is %s",
                    event.getAppointmentId(),
                    event.getDoctorName(),
                    event.getAppointmentDate(),
                    event.getStartTime(),
                    event.getEventType()
            );

            // 1. Send Patient Email
            emailService.sendEmail(event.getPatientEmail(), subject, patientBody);

            // 2. Send Doctor Email
            emailService.sendEmail(event.getDoctorEmail(), subject, doctorBody);

            // 3. Send Patient SMS
            smsService.sendSms(event.getPatientPhone(), smsText);

        } catch (Exception e) {
            log.error("Error processing ActiveMQ notification message: {}", e.getMessage());
        }
    }
}