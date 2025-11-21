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
import java.util.Arrays;
import java.util.Date;
import java.util.List;
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

    /**
     * Tenta decodificar a chave como Base64 ou Base64URL.
     * Se falhar, usa o texto cru (UTF-8).
     */
    private static byte[] decodeSecretAuto(String secret) {
        if (secret.contains("-") || secret.contains("_")) {
            try {
                return Decoders.BASE64URL.decode(secret);
            } catch (IllegalArgumentException ignored) {}
        }

        if (secret.contains("+") || secret.contains("/")) {
            try {
                return Decoders.BASE64.decode(secret);
            } catch (IllegalArgumentException ignored) {}
        }

        // fallback
        return secret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Gera um JWT contendo:
     * - subject = username
     * - claim "roles" = autoridades em CSV
     * - expiração configurável
     */
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

    /**
     * Extrai o username (subject).
     */
    public String extractUsername(String token) {
        return parseAll(token).getBody().getSubject();
    }

    /**
     * Extrai roles como CSV.
     */
    public String extractRolesCsv(String token) {
        Object raw = parseAll(token).getBody().get("roles");
        return raw != null ? raw.toString() : "";
    }

    /**
     * Extrai roles como lista.
     */
    public List<String> extractRoles(String token) {
        String csv = extractRolesCsv(token);
        if (csv == null || csv.isBlank()) {
            return List.of();
        }

        return Arrays.stream(csv.split("[,;\\s]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Valida o token verificando:
     * - assinatura
     * - expiração
     * - subject igual ao usuário informado
     */
    public boolean isValid(String token, UserDetails user) {
        try {
            Claims claims = parseAll(token).getBody();
            return user.getUsername().equals(claims.getSubject())
                    && claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Faz o parse completo do token e aplica skew de relógio.
     */
    private Jws<Claims> parseAll(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .setAllowedClockSkewSeconds(clockSkewSeconds)
                .build()
                .parseClaimsJws(token);
    }
}
