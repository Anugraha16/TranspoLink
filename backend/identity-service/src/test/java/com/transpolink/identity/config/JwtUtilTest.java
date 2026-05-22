package com.transpolink.identity.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "transpolink-super-secret-key-minimum-32-characters-long");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L);
    }

    @Test
    void generateToken_returnsNonNullToken() {
        String token = jwtUtil.generateToken("1", Map.of("role", "CITIZEN"));
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void extractUserId_returnsCorrectSubject() {
        String token = jwtUtil.generateToken("42", Map.of("role", "ADMIN"));
        assertThat(jwtUtil.extractUserId(token)).isEqualTo("42");
    }

    @Test
    void extractRole_returnsCorrectRole() {
        String token = jwtUtil.generateToken("1", Map.of("role", "TRAFFIC_OFFICER"));
        assertThat(jwtUtil.extractRole(token)).isEqualTo("TRAFFIC_OFFICER");
    }

    @Test
    void extractClaims_containsAllClaims() {
        String token = jwtUtil.generateToken("5", Map.of("role", "COMPLIANCE_OFFICER"));
        Claims claims = jwtUtil.extractClaims(token);

        assertThat(claims.getSubject()).isEqualTo("5");
        assertThat(claims.get("role", String.class)).isEqualTo("COMPLIANCE_OFFICER");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();
    }

    @Test
    void isTokenExpired_returnsFalseForValidToken() {
        String token = jwtUtil.generateToken("1", Map.of("role", "CITIZEN"));
        assertThat(jwtUtil.isTokenExpired(token)).isFalse();
    }

    @Test
    void isTokenExpired_throwsForExpiredToken() {
        ReflectionTestUtils.setField(jwtUtil, "expiration", -1000L);
        String token = jwtUtil.generateToken("1", Map.of("role", "CITIZEN"));

        assertThatThrownBy(() -> jwtUtil.isTokenExpired(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void generateToken_withMultipleClaims() {
        String token = jwtUtil.generateToken("10", Map.of("role", "ADMIN", "extra", "value"));
        Claims claims = jwtUtil.extractClaims(token);

        assertThat(claims.get("role", String.class)).isEqualTo("ADMIN");
        assertThat(claims.get("extra", String.class)).isEqualTo("value");
    }

    @Test
    void extractClaims_throwsOnTamperedToken() {
        String token = jwtUtil.generateToken("1", Map.of("role", "CITIZEN"));
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThatThrownBy(() -> jwtUtil.extractClaims(tampered))
                .isInstanceOf(Exception.class);
    }
}
