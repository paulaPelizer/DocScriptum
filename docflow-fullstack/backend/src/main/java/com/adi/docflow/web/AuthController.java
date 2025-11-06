package com.adi.docflow.web;

import com.adi.docflow.model.AppUser;
import com.adi.docflow.repository.UserRepository;
import com.adi.docflow.config.security.JwtService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    // ===== TOKENS VINDOS DO application.yml =====
    @Value("${app.auth.registration.dba-token}")
    private String dbaToken;

    @Value("${app.auth.registration.admin-token}")
    private String adminToken;

    @Value("${app.auth.registration.resource-token}")
    private String resourceToken;

    @Value("${app.auth.registration.user-token}")
    private String userToken; // se não for usar, pode remover

    public AuthController(AuthenticationManager authManager,
                          JwtService jwtService,
                          UserRepository userRepo,
                          PasswordEncoder encoder) {
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.encoder = encoder;
    }

    // ===== DTOs =====

    public record LoginDTO(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record AuthResponse(String token, String username, List<String> roles) {}

    // RegisterDTO AGORA TEM EMAIL
    public record RegisterDTO(
            @NotBlank String username,
            @NotBlank String password,
            @NotBlank String email,  // <- email aqui
            String token              // vem no body; pode ser null se vier só no header
    ) {}

    // ===== LOGIN =====

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginDTO dto) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.username(), dto.password())
        );

        UserDetails user = (UserDetails) auth.getPrincipal();
        String token = jwtService.generateToken(user);

        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), roles));
    }

    // ===== REGISTRO DE NOVO USUÁRIO (com token/perfil) =====

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterDTO dto,
                                      @RequestHeader(name = "X-REG-TOKEN", required = false) String headerToken) {

        // 1) Pega o token: primeiro do body, se não vier usa o header
        String token = dto.token();
        if (token == null || token.isBlank()) {
            token = headerToken;
        }

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body("Token de autorização ausente");
        }

        token = token.trim();

        // 2) Define o papel conforme o token do application.yml
        String role;
        if (token.equals(dbaToken)) {
            role = "DBA";
        } else if (token.equals(adminToken)) {
            role = "ADMIN";
        } else if (token.equals(resourceToken)) {
            role = "RESOURCE";
        } else if (token.equals(userToken)) {
            // aqui você decide: pode ser "RESOURCE" também ou outro papel
            role = "RESOURCE";
        } else {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body("Token de autorização inválido");
        }

        // 3) Verifica se já existe usuário
        if (userRepo.existsByUsernameIgnoreCase(dto.username())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Usuário já existe");
        }

        // 4) Cria usuário
        AppUser u = new AppUser();
        u.setUsername(dto.username().trim());
        u.setPassword(encoder.encode(dto.password()));
        u.setEnabled(true);              // <- aqui é só true mesmo
        u.setRoles(role);                // "DBA" | "ADMIN" | "RESOURCE"

        // Seta o e-mail no AppUser
        if (dto.email() != null) {
            u.setEmail(dto.email().trim());
        }

        userRepo.save(u);

        return ResponseEntity.ok(Map.of(
                "username", u.getUsername(),
                "role", role
        ));
    }

    // ===== ME / LOGOUT =====

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal UserDetails user) {
        if (user == null) return Map.of();
        return Map.of(
                "username", user.getUsername(),
                "roles", user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList()
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // stateless: só apagar token no front
        return ResponseEntity.noContent().build();
    }
}
