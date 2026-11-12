package com.healthcare.doctor.repository;

import com.healthcare.doctor.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUserId(Long userId);
    List<Doctor> findBySpecialtyContainingIgnoreCaseAndVerifiedTrue(String specialty);
    List<Doctor> findByVerifiedTrue();
}