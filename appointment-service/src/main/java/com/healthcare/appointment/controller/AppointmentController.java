package com.healthcare.appointment.controller;

import com.healthcare.appointment.dto.AppointmentEvent;
import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.repository.AppointmentRepository;
import com.healthcare.appointment.service.NotificationPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final RestTemplate restTemplate;
    private final NotificationPublisher notificationPublisher;

    @Value("${services.doctor-service-url}")
    private String doctorServiceUrl;

    // 1. Book an Appointment (Sync REST to Doctor Service + Async Event to ActiveMQ)
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody Appointment request) {
        String lockSlotUrl = doctorServiceUrl + "/api/doctors/slots/" + request.getSlotId() + "/book?booked=true";

        // Step 1: Synchronously verify and lock the slot in doctor-service
        try {
            restTemplate.exchange(lockSlotUrl, HttpMethod.PUT, null, Map.class);
        } catch (HttpClientErrorException.Conflict e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Selected time slot is already booked."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Unable to verify slot with Doctor Service: " + e.getMessage()));
        }

        // Step 2: Generate a Jitsi Meet Telemedicine link and save the appointment
        request.setStatus(AppointmentStatus.CONFIRMED);
        request.setCreatedAt(LocalDateTime.now());
        request.setMeetingLink("https://meet.jit.si/SmartHealth-Consult-" + UUID.randomUUID().toString().substring(0, 8));

        Appointment saved = appointmentRepository.save(request);

        // Step 3: Publish event asynchronously to ActiveMQ
        notificationPublisher.publishAppointmentEvent(AppointmentEvent.builder()
                .appointmentId(saved.getId())
                .eventType("BOOKED")
                .patientName(saved.getPatientName())
                .patientEmail(saved.getPatientEmail())
                .patientPhone(saved.getPatientPhone())
                .doctorName(saved.getDoctorName())
                .doctorEmail(saved.getDoctorEmail())
                .appointmentDate(String.valueOf(saved.getAppointmentDate()))
                .startTime(String.valueOf(saved.getStartTime()))
                .meetingLink(saved.getMeetingLink())
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 2. Get Appointments for a Patient
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable Long patientId) {
        return ResponseEntity.ok(appointmentRepository.findByPatientIdOrderByCreatedAtDesc(patientId));
    }

    // 3. Get Appointments for a Doctor
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable Long doctorId) {
        return ResponseEntity.ok(appointmentRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId));
    }

    // 4. Update Appointment Status (Cancel / Complete / Reject)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam AppointmentStatus status) {

        return appointmentRepository.findById(id)
                .map(appointment -> {
                    appointment.setStatus(status);
                    Appointment updated = appointmentRepository.save(appointment);

                    // If cancelled or rejected, release the slot in doctor-service
                    if (status == AppointmentStatus.CANCELLED || status == AppointmentStatus.REJECTED) {
                        try {
                            String unlockUrl = doctorServiceUrl + "/api/doctors/slots/" + appointment.getSlotId() + "/book?booked=false";
                            restTemplate.exchange(unlockUrl, HttpMethod.PUT, null, Map.class);
                        } catch (Exception ignored) {}
                    }

                    // Publish status change notification to ActiveMQ
                    notificationPublisher.publishAppointmentEvent(AppointmentEvent.builder()
                            .appointmentId(updated.getId())
                            .eventType(status.name())
                            .patientName(updated.getPatientName())
                            .patientEmail(updated.getPatientEmail())
                            .patientPhone(updated.getPatientPhone())
                            .doctorName(updated.getDoctorName())
                            .doctorEmail(updated.getDoctorEmail())
                            .appointmentDate(String.valueOf(updated.getAppointmentDate()))
                            .startTime(String.valueOf(updated.getStartTime()))
                            .meetingLink(updated.getMeetingLink())
                            .build());

                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}