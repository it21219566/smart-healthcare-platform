package com.healthcare.doctor.controller;

import com.healthcare.doctor.entity.AvailabilitySlot;
import com.healthcare.doctor.entity.Doctor;
import com.healthcare.doctor.entity.Prescription;
import com.healthcare.doctor.repository.AvailabilitySlotRepository;
import com.healthcare.doctor.repository.DoctorRepository;
import com.healthcare.doctor.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final AvailabilitySlotRepository slotRepository;
    private final PrescriptionRepository prescriptionRepository;

    // 1. Doctor creates or updates their profile
    @PostMapping("/profile")
    public ResponseEntity<Doctor> saveProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Doctor request) {

        Doctor doctor = doctorRepository.findByUserId(userId).orElse(new Doctor());
        doctor.setUserId(userId);
        doctor.setFullName(request.getFullName());
        doctor.setEmail(request.getEmail());
        doctor.setSpecialty(request.getSpecialty());
        doctor.setQualification(request.getQualification());
        doctor.setSlmcRegNumber(request.getSlmcRegNumber());
        doctor.setConsultationFee(request.getConsultationFee());

        return ResponseEntity.ok(doctorRepository.save(doctor));
    }

    // 2. Public Search: Browse verified doctors by specialty (or all if specialty is omitted)
    @GetMapping("/search")
    public ResponseEntity<List<Doctor>> searchDoctors(
            @RequestParam(required = false) String specialty) {
        if (specialty == null || specialty.isBlank()) {
            return ResponseEntity.ok(doctorRepository.findByVerifiedTrue());
        }
        return ResponseEntity.ok(doctorRepository.findBySpecialtyContainingIgnoreCaseAndVerifiedTrue(specialty));
    }

    // 3. Admin Endpoint: List all doctors (including unverified) & verify a doctor
    @GetMapping("/all")
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @PutMapping("/{doctorId}/verify")
    public ResponseEntity<?> verifyDoctor(
            @PathVariable Long doctorId,
            @RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Only ADMIN can verify doctors"));
        }
        return doctorRepository.findById(doctorId)
                .map(doc -> {
                    doc.setVerified(true);
                    return ResponseEntity.ok(doctorRepository.save(doc));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. Doctor adds availability time slot
    @PostMapping("/{doctorId}/slots")
    public ResponseEntity<AvailabilitySlot> addSlot(
            @PathVariable Long doctorId,
            @RequestBody AvailabilitySlot slot) {
        slot.setDoctorId(doctorId);
        slot.setBooked(false);
        return ResponseEntity.status(HttpStatus.CREATED).body(slotRepository.save(slot));
    }

    // 5. Get available (unbooked) slots for a doctor
    @GetMapping("/{doctorId}/slots")
    public ResponseEntity<List<AvailabilitySlot>> getAvailableSlots(@PathVariable Long doctorId) {
        return ResponseEntity.ok(
                slotRepository.findByDoctorIdAndIsBookedFalseOrderByAvailableDateAscStartTimeAsc(doctorId));
    }

    // 6. Inter-Service Endpoint (Called by Appointment Service on Day 3 to lock/release a slot)
    @PutMapping("/slots/{slotId}/book")
    public ResponseEntity<?> markSlotBooked(
            @PathVariable Long slotId,
            @RequestParam(defaultValue = "true") boolean booked) {
        return slotRepository.findById(slotId)
                .map(slot -> {
                    if (booked && slot.isBooked()) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(Map.of("message", "Slot is already booked"));
                    }
                    slot.setBooked(booked);
                    return ResponseEntity.ok(slotRepository.save(slot));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 7. Doctor issues digital prescription
    @PostMapping("/prescriptions")
    public ResponseEntity<Prescription> issuePrescription(@RequestBody Prescription prescription) {
        prescription.setIssuedAt(LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(prescriptionRepository.save(prescription));
    }

    // 8. View prescriptions for a patient
    @GetMapping("/prescriptions/patient/{patientId}")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long patientId) {
        return ResponseEntity.ok(prescriptionRepository.findByPatientIdOrderByIssuedAtDesc(patientId));
    }
}