package com.healthcare.patient.controller;

import com.healthcare.patient.entity.MedicalReport;
import com.healthcare.patient.entity.Patient;
import com.healthcare.patient.repository.MedicalReportRepository;
import com.healthcare.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRepository patientRepository;
    private final MedicalReportRepository reportRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // Create or update patient profile
    @PostMapping("/profile")
    public ResponseEntity<Patient> saveOrUpdateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Patient request) {

        Patient patient = patientRepository.findByUserId(userId)
                .orElse(new Patient());

        patient.setUserId(userId);
        patient.setFullName(request.getFullName());
        patient.setEmail(request.getEmail());
        patient.setPhone(request.getPhone());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setAllergies(request.getAllergies());
        patient.setMedicalHistory(request.getMedicalHistory());

        return ResponseEntity.ok(patientRepository.save(patient));
    }

    // Get profile by patientId or userId
    @GetMapping("/{id}")
    public ResponseEntity<?> getPatientById(@PathVariable Long id) {
        return patientRepository.findById(id)
                .or(() -> patientRepository.findByUserId(id))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Upload a medical report (PDF/Image)
    @PostMapping("/{patientId}/reports")
    public ResponseEntity<?> uploadReport(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) throws IOException {

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path targetLocation = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        MedicalReport report = MedicalReport.builder()
                .patientId(patientId)
                .reportName(file.getOriginalFilename())
                .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .filePath(targetLocation.toString())
                .description(description)
                .uploadedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(reportRepository.save(report));
    }

    // List all reports for a patient (Accessible by Patient & Doctor)
    @GetMapping("/{patientId}/reports")
    public ResponseEntity<List<MedicalReport>> getPatientReports(@PathVariable Long patientId) {
        return ResponseEntity.ok(reportRepository.findByPatientIdOrderByUploadedAtDesc(patientId));
    }

    // Download/view a specific medical report file
    @GetMapping("/reports/{reportId}/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long reportId) throws IOException {
        MedicalReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        Path filePath = Paths.get(report.getFilePath()).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(report.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + report.getReportName() + "\"")
                .body(resource);
    }
}