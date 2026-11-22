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
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientRepository patientRepository;
    private final MedicalReportRepository reportRepository;

    @Value("${file.upload-dir:./uploads/reports}")
    private String uploadDir;

    // 1. Create or update Patient profile
    @PostMapping("/profile")
    public ResponseEntity<Patient> saveProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Patient req) {

        Patient patient = patientRepository.findByUserId(userId).orElse(new Patient());
        patient.setUserId(userId);
        patient.setFullName(req.getFullName());
        patient.setEmail(req.getEmail());
        patient.setPhone(req.getPhone());
        patient.setDateOfBirth(req.getDateOfBirth());
        patient.setBloodGroup(req.getBloodGroup());
        patient.setAllergies(req.getAllergies());
        patient.setMedicalHistory(req.getMedicalHistory());

        return ResponseEntity.ok(patientRepository.save(patient));
    }

    // 2. Get Patient profile by Auth userId
    @GetMapping("/{userId}")
    public ResponseEntity<Patient> getProfile(@PathVariable Long userId) {
        return patientRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. Upload medical report (optionally linked to a specific appointmentId)
    @PostMapping(value = "/{patientId}/reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MedicalReport> uploadReport(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", defaultValue = "Pre-Consultation Report") String description,
            @RequestParam(value = "appointmentId", required = false) Long appointmentId) throws IOException {

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String originalFilename = file.getOriginalFilename() != null
                ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                : "report";
        String storedName = UUID.randomUUID() + "_" + originalFilename;
        Path targetLocation = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        MedicalReport report = MedicalReport.builder()
                .patientId(patientId)
                .appointmentId(appointmentId)
                .reportName(originalFilename)
                .fileType(file.getContentType())
                .filePath(targetLocation.toString())
                .description(description)
                .uploadedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(reportRepository.save(report));
    }

    // 4. Fetch all medical reports for a patient
    @GetMapping("/{patientId}/reports")
    public ResponseEntity<List<MedicalReport>> getReports(@PathVariable Long patientId) {
        return ResponseEntity.ok(reportRepository.findByPatientIdOrderByUploadedAtDesc(patientId));
    }

    // 5. Fetch medical reports attached to a specific appointment (used by Doctor Workspace)
    @GetMapping("/reports/appointment/{appointmentId}")
    public ResponseEntity<List<MedicalReport>> getReportsByAppointment(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(reportRepository.findByAppointmentIdOrderByUploadedAtDesc(appointmentId));
    }

    // 6. Stream / download a specific medical report
    @GetMapping("/reports/{reportId}/download")
    public ResponseEntity<Resource> downloadReport(@PathVariable Long reportId) {
        return reportRepository.findById(reportId)
                .map(report -> {
                    try {
                        Path filePath = Paths.get(report.getFilePath()).toAbsolutePath().normalize();
                        Resource resource = new UrlResource(filePath.toUri());
                        if (!resource.exists() || !resource.isReadable()) {
                            return ResponseEntity.notFound().<Resource>build();
                        }

                        String contentType = (report.getFileType() != null && !report.getFileType().isBlank())
                                ? report.getFileType()
                                : MediaType.APPLICATION_OCTET_STREAM_VALUE;

                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType))
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                        "inline; filename=\"" + report.getReportName() + "\"")
                                .body(resource);
                    } catch (MalformedURLException e) {
                        return ResponseEntity.internalServerError().<Resource>build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}