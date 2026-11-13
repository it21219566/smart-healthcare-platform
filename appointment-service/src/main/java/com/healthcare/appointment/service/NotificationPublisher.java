package com.healthcare.appointment.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.appointment.dto.AppointmentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final JmsTemplate jmsTemplate;
    private final ObjectMapper objectMapper;

    private static final String QUEUE_NAME = "appointment.notification.queue";

    public void publishAppointmentEvent(AppointmentEvent event) {
        try {
            String jsonPayload = objectMapper.writeValueAsString(event);
            jmsTemplate.convertAndSend(QUEUE_NAME, jsonPayload);
            log.info("Published {} event to ActiveMQ for Appointment ID: {}",
                    event.getEventType(), event.getAppointmentId());
        } catch (Exception e) {
            log.error("Failed to publish event to ActiveMQ: {}", e.getMessage());
        }
    }
}