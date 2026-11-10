// auth-service/src/main/java/com/healthcare/auth/dto/AuthResponse.java
package com.healthcare.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String fullName;
    private String role;
}