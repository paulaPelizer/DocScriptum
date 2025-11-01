// src/main/java/com/adi/docflow/web/AuthController.java
package com.adi.docflow.web;

import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.adi.docflow.config.security.JwtService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthenticationManager authManager;
  private final JwtService jwtService;

  public AuthController(AuthenticationManager authManager, JwtService jwtService) {
    this.authManager = authManager;
    this.jwtService = jwtService;
  }

  // DTO de entrada
  public record LoginDTO(
      @NotBlank String username,
      @NotBlank String password
  ) {}

  // DTO de resposta (opcional, para tipar melhor)
  public record AuthResponse(String token, String username, List<String> roles) {}

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@RequestBody LoginDTO dto) {
    // Autentica (lança exceção 401 se errado)
    Authentication auth = authManager.authenticate(
        new UsernamePasswordAuthenticationToken(dto.username(), dto.password())
    );

    // Gera JWT a partir do usuário autenticado
    UserDetails user = (UserDetails) auth.getPrincipal();
    String token = jwtService.generateToken(user);

    // Extrai roles para o front (se precisar)
    List<String> roles = user.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .toList();

    return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), roles));
  }

  // Endpoint simples para o front checar quem é o usuário atual (com Bearer token)
  @GetMapping("/me")
  public Map<String, Object> me(@AuthenticationPrincipal UserDetails user) {
    if (user == null) return Map.of(); // sem auth → vazio
    return Map.of(
        "username", user.getUsername(),
        "roles", user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList()
    );
  }

  // Em arquitetura stateless, "logout" é no front (descartar token).
  // Mantemos o endpoint para compatibilidade, mas é no-op.
  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    return ResponseEntity.noContent().build();
  }
}


