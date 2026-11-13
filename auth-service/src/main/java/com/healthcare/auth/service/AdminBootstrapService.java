package com.healthcare.auth.service;

import com.healthcare.auth.entity.Role;
import com.healthcare.auth.entity.UserCredential;
import com.healthcare.auth.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrapService implements ApplicationRunner {

    private final UserCredentialRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.initial-admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.security.initial-admin.email:}")
    private String initialAdminEmail;

    @Value("${app.security.initial-admin.password:}")
    private String initialAdminPassword;

    private static final String CHAR_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

    @Override
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            log.info("Initial ADMIN provisioning is disabled (INITIAL_ADMIN_ENABLED=false).");
            return;
        }

        if (repository.countByRole(Role.ADMIN) > 0) {
            log.info("An ADMIN account already exists in auth_db. Skipping initial bootstrap.");
            return;
        }

        if (initialAdminEmail == null || initialAdminEmail.isBlank()) {
            log.warn("INITIAL_ADMIN_EMAIL is not configured. Skipping ADMIN bootstrap.");
            return;
        }

        String normalizedEmail = initialAdminEmail.trim().toLowerCase(Locale.ROOT);

        boolean generatedRandom = false;
        String rawPassword = initialAdminPassword;
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = generateSecureRandomPassword(20);
            generatedRandom = true;
        }

        UserCredential admin = UserCredential.builder()
                .fullName("System Administrator")
                .email(normalizedEmail)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.ADMIN)
                .passwordChangeRequired(true)
                .build();

        try {
            repository.save(admin);
            log.warn("\n======================================================================\n" +
                     " INITIAL ADMIN ACCOUNT PROVISIONED (ONE-TIME BOOTSTRAP)\n" +
                     " Email: {}\n" +
                     " One-Time Password: {}\n" +
                     " Action Required: You MUST change this password on first login.\n" +
                     " Set INITIAL_ADMIN_ENABLED=false in production after initial setup.\n" +
                     "======================================================================",
                     normalizedEmail,
                     generatedRandom ? rawPassword : "[Provided via INITIAL_ADMIN_PASSWORD env]");
        } catch (DataIntegrityViolationException ex) {
            log.info("Concurrent instance already provisioned the initial ADMIN account.");
        }
    }

    private String generateSecureRandomPassword(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHAR_POOL.charAt(random.nextInt(CHAR_POOL.length())));
        }
        return sb.toString();
    }
}