// auth-service/src/main/java/com/healthcare/auth/dto/RegisterRequest.java
package com.healthcare.auth.dto;

import com.healthcare.auth.entity.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private Role role; // PATIENT, DOCTOR, ADMIN
}