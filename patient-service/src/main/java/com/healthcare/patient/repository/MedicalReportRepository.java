package com.healthcare.patient.repository;

import com.healthcare.patient.entity.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    List<MedicalReport> findByPatientIdOrderByUploadedAtDesc(Long patientId);
}