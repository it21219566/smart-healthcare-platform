package com.healthcare.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Standard token generation (defaults to passwordChangeRequired = false).
     */
    public String generateToken(Long userId, String email, String role) {
        return generateToken(userId, email, role, false);
    }

    /**
     * Generates a JWT. If passwordChangeRequired is true, issues a short-lived (15 min)
     * restricted token with role = PASSWORD_CHANGE_REQUIRED so the API Gateway blocks
     * all downstream calls except /api/auth/change-password.
     */
    public String generateToken(Long userId, String email, String role, boolean passwordChangeRequired) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("role", passwordChangeRequired ? "PASSWORD_CHANGE_REQUIRED" : role);

        long expirationMs = passwordChangeRequired
                ? 1000L * 60 * 15       // 15 minutes for temporary password rotation
                : 1000L * 60 * 60 * 24; // 24 hours for standard sessions

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSignKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}