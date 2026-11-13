package com.healthcare.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.notification.dto.AppointmentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final ObjectMapper objectMapper;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @JmsListener(destination = "appointment.notification.queue")
    public void consumeAppointmentEvent(String jsonMessage) {
        try {
            AppointmentEvent event = objectMapper.readValue(jsonMessage, AppointmentEvent.class);

            String subject = "Smart Healthcare - Appointment " + event.getEventType() + " (#" + event.getAppointmentId() + ")";
            String body = String.format(
                    "Dear %s,\n\nYour telemedicine appointment with %s on %s at %s is now %s.\nVideo Consultation Link: %s\n\nThank you,\nSmart Healthcare Platform",
                    event.getPatientName(),
                    event.getDoctorName(),
                    event.getAppointmentDate(),
                    event.getStartTime(),
                    event.getEventType(),
                    event.getMeetingLink()
            );

            // 1. Send or Simulate Email Notification
            sendEmail(event.getPatientEmail(), subject, body);
            if (event.getDoctorEmail() != null && !event.getDoctorEmail().isBlank()) {
                sendEmail(event.getDoctorEmail(), subject,
                        "Doctor Notification: Appointment #" + event.getAppointmentId() + " with " + event.getPatientName() + " is " + event.getEventType());
            }

            // 2. Dispatch SMS Gateway Notification
            sendSms(event.getPatientPhone(),
                    "SmartHealth: Appt #" + event.getAppointmentId() + " with " + event.getDoctorName() +
                    " on " + event.getAppointmentDate() + " at " + event.getStartTime() + " is " + event.getEventType());

        } catch (Exception e) {
            log.error("Error processing notification event from ActiveMQ: {}", e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailUsername != null && !mailUsername.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
                log.info("[EMAIL SENT] To: {} | Subject: {}", to, subject);
                return;
            } catch (Exception e) {
                log.warn("SMTP send failed ({}), falling back to console log.", e.getMessage());
            }
        }
        log.info("\n================ EMAIL DISPATCHED ================\nTo: {}\nSubject: {}\n{}\n==================================================", to, subject, text);
    }

    private void sendSms(String phone, String message) {
        log.info("\n================ SMS DISPATCHED ================\nTo: {}\nMessage: {}\n================================================", phone, message);
    }
}