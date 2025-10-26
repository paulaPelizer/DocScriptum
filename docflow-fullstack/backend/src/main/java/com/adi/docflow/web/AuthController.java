// src/main/java/com/adi/docflow/web/AuthController.java
package com.adi.docflow.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
//import com.adi.docflow.service.UserService;
//import com.adi.docflow.web.dto.RegisterUserDTO;
//import com.adi.docflow.web.dto.UserCreatedDTO;

//import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthenticationManager authManager;

  public AuthController(AuthenticationManager authManager) {
    this.authManager = authManager;
  }

  public record LoginDTO(String username, String password) {}

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginDTO dto, HttpServletRequest req) {
    Authentication auth = authManager.authenticate(
      new UsernamePasswordAuthenticationToken(dto.username(), dto.password())
    );
    // guarda no contexto…
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(auth);
    SecurityContextHolder.setContext(context);
    // …e garante que a sessão exista (gera o JSESSIONID)
    req.getSession(true);
    return ResponseEntity.ok(Map.of("username", auth.getName()));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletRequest req, HttpServletResponse res) throws Exception {
    req.logout();
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/me")
  public Map<String, Object> me() {
    Authentication a = SecurityContextHolder.getContext().getAuthentication();
    return Map.of("name", a.getName(), "authorities", a.getAuthorities());
  }
}
