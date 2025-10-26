package com.adi.docflow.config.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.util.Date;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private final Key key;
    private final long expMillis;
    private final long clockSkewSeconds;

    public JwtService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.exp-minutes:120}") long expMinutes,
            @Value("${security.jwt.clock-skew-seconds:30}") long clockSkewSeconds
    ) {
        byte[] raw = decodeSecretAuto(secret);
        if (raw.length < 32) {
            // HS256 requer >= 256 bits
            throw new IllegalArgumentException("security.jwt.secret muito curto (precisa >= 32 bytes)");
        }
        this.key = Keys.hmacShaKeyFor(raw);
        this.expMillis = Duration.ofMinutes(expMinutes).toMillis();
        this.clockSkewSeconds = clockSkewSeconds;
    }

    private static byte[] decodeSecretAuto(String secret) {
        // base64 URL-safe com '-' ou '_')
        if (secret.contains("-") || secret.contains("_")) {
            try { return Decoders.BASE64URL.decode(secret); } catch (IllegalArgumentException ignored) { /* fallback */ }
        }
        // base64 “padrão” com '+' ou '/')
        if (secret.contains("+") || secret.contains("/")) {
            try { return Decoders.BASE64.decode(secret); } catch (IllegalArgumentException ignored) { /* fallback */ }
        }
        // Fallback: texto cru (UTF-8)
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    public String generateToken(UserDetails user) {
        long now = System.currentTimeMillis();
        String rolesCsv = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("roles", rolesCsv)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return parseAll(token).getBody().getSubject();
    }

    public boolean isValid(String token, UserDetails user) {
        try {
            Claims claims = parseAll(token).getBody();
            return user.getUsername().equals(claims.getSubject())
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Jws<Claims> parseAll(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .setAllowedClockSkewSeconds(clockSkewSeconds)
                .build()
                .parseClaimsJws(token);
    }
}
