package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<Appointment> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
}