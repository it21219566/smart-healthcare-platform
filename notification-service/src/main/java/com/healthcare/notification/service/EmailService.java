package com.healthcare.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${notification.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${notification.email.from:noreply@smarthealth.lk}")
    private String fromAddress;

    public void sendEmail(String to, String subject, String body) {
        // Always log to Docker console
        log.info("\n================ EMAIL DISPATCHED ================\n" +
                 "To: {}\nSubject: {}\n{}\n" +
                 "==================================================", to, subject, body);

        if (!emailEnabled || to == null || to.isBlank()) {
            log.info("[EmailService] Live SMTP disabled or recipient empty. Logged only.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EmailService] Live email successfully sent to {}", to);
        } catch (Exception e) {
            log.error("[EmailService] Failed to send live email to {}: {}", to, e.getMessage());
        }
    }
}