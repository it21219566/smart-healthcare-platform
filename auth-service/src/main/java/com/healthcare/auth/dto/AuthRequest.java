// auth-service/src/main/java/com/healthcare/auth/dto/AuthRequest.java
package com.healthcare.auth.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
}