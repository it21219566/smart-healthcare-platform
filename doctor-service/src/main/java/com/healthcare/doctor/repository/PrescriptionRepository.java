package com.healthcare.doctor.repository;

import com.healthcare.doctor.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientIdOrderByIssuedAtDesc(Long patientId);
}