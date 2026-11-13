package com.healthcare.auth.controller;

import com.healthcare.auth.dto.*;
import com.healthcare.auth.entity.Role;
import com.healthcare.auth.entity.UserCredential;
import com.healthcare.auth.repository.UserCredentialRepository;
import com.healthcare.auth.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserCredentialRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, and 1 special char
    private static final Pattern STRONG_PASSWORD =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$");

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    // 1. Public Registration: Strictly PATIENT role only
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        String email = normalize(request.getEmail());
        if (!STRONG_PASSWORD.matcher(request.getPassword() != null ? request.getPassword() : "").matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            ));
        }

        if (repository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }

        try {
            UserCredential user = UserCredential.builder()
                    .fullName(request.getFullName())
                    .email(email)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.PATIENT)
                    .passwordChangeRequired(false)
                    .build();

            UserCredential saved = repository.save(user);
            String token = jwtService.generateToken(saved.getId(), saved.getEmail(), saved.getRole().name(), false);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(token, saved.getId(), saved.getFullName(), saved.getRole().name(), false));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }
    }

    // 2. Admin-Only Endpoint: Create Doctor Login Credentials (Sets passwordChangeRequired = true)
    @PostMapping("/admin/create-doctor")
    public ResponseEntity<?> createDoctorAccount(
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestBody RegisterRequest request) {

        if (!"ADMIN".equals(roleHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied: Only verified ADMIN can onboard doctors"));
        }

        String email = normalize(request.getEmail());
        if (repository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Doctor email already exists"));
        }

        if (request.getPassword() == null || request.getPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Temporary doctor password must be at least 8 characters."));
        }

        try {
            UserCredential doctorUser = UserCredential.builder()
                    .fullName(request.getFullName())
                    .email(email)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(Role.DOCTOR)
                    .passwordChangeRequired(true)
                    .build();

            UserCredential saved = repository.save(doctorUser);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "userId", saved.getId(),
                            "fullName", saved.getFullName(),
                            "email", saved.getEmail(),
                            "role", saved.getRole().name()
                    ));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Doctor email already exists"));
        }
    }

    // 3. Login for all roles (PATIENT, DOCTOR, ADMIN)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        String email = normalize(request.getEmail());
        return repository.findByEmail(email)
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .map(user -> {
                    String token = jwtService.generateToken(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name(),
                            user.isPasswordChangeRequired()
                    );
                    return ResponseEntity.ok((Object) new AuthResponse(
                            token,
                            user.getId(),
                            user.getFullName(),
                            user.getRole().name(),
                            user.isPasswordChangeRequired()
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid email or password")));
    }

    // 4. Mandatory First-Login Password Rotation Endpoint
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody ChangePasswordRequest request) {

        if (!STRONG_PASSWORD.matcher(request.getNewPassword() != null ? request.getNewPassword() : "").matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "New password must be at least 8 characters and include uppercase, lowercase, number, and special character."
            ));
        }

        return repository.findById(userId)
                .map(user -> {
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "Current password is incorrect"));
                    }
                    if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "New password cannot be the same as the temporary password"));
                    }

                    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                    user.setPasswordChangeRequired(false);
                    UserCredential updated = repository.save(user);

                    String newToken = jwtService.generateToken(
                            updated.getId(),
                            updated.getEmail(),
                            updated.getRole().name(),
                            false
                    );

                    return ResponseEntity.ok((Object) new AuthResponse(
                            newToken,
                            updated.getId(),
                            updated.getFullName(),
                            updated.getRole().name(),
                            false
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found")));
    }
}