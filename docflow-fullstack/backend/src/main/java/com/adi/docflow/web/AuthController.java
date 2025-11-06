package com.adi.docflow.web;

import com.adi.docflow.config.security.JwtService;
import com.adi.docflow.model.AppUser;
import com.adi.docflow.model.PasswordResetToken;
import com.adi.docflow.repository.PasswordResetTokenRepository;
import com.adi.docflow.repository.UserRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final JavaMailSender mailSender;

    // ===== TOKENS VINDOS DO application.yml =====
    @Value("${app.auth.registration.dba-token}")
    private String dbaToken;

    @Value("${app.auth.registration.admin-token}")
    private String adminToken;

    @Value("${app.auth.registration.resource-token}")
    private String resourceToken;

    @Value("${app.auth.registration.user-token}")
    private String userToken; // se não for usar, pode remover

    // URL base para tela de redefinição no frontend
    @Value("${app.frontend.reset-url}")
    private String frontendResetUrl;

    public AuthController(AuthenticationManager authManager,
                          JwtService jwtService,
                          UserRepository userRepo,
                          PasswordEncoder encoder,
                          PasswordResetTokenRepository resetTokenRepo,
                          JavaMailSender mailSender) {
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.resetTokenRepo = resetTokenRepo;
        this.mailSender = mailSender;
    }

    // ===== DTOs =====

    public record LoginDTO(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record AuthResponse(String token, String username, List<String> roles) {}

    public record RegisterDTO(
            @NotBlank String username,
            @NotBlank String password,
            @NotBlank String email,
            String token // vem no body; pode ser null se vier só no header
    ) {}

    // <<< NOVO: DTO para solicitar redefinição de senha >>>
    public record ForgotPasswordDTO(
            @NotBlank String email
    ) {}

    // <<< NOVO: DTO para aplicar a nova senha/usuário >>>
    public record ResetPasswordDTO(
            @NotBlank String token,
            @NotBlank String newPassword,
            String newUsername
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
        u.setEnabled(true);
        u.setRoles(role); // "DBA" | "ADMIN" | "RESOURCE"

        if (dto.email() != null) {
            u.setEmail(dto.email().trim());
        }

        userRepo.save(u);

        return ResponseEntity.ok(Map.of(
                "username", u.getUsername(),
                "role", role
        ));
    }

    // ===== NOVO: SOLICITAÇÃO DE REDEFINIÇÃO DE SENHA POR E-MAIL =====

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordDTO dto) {
        String email = dto.email().trim();

        Optional<AppUser> optUser = userRepo.findByEmail(email);

        // Por segurança, sempre responder OK, mesmo se o e-mail não existir
        if (optUser.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Se o e-mail estiver cadastrado, enviaremos instruções para redefinição."
            ));
        }

        AppUser user = optUser.get();

        // Gera token aleatório
        String token = UUID.randomUUID().toString();

        // Cria registro de token com expiração (ex.: 1 hora)
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        resetToken.setUsed(false);

        resetTokenRepo.save(resetToken);

        // Monta link de redefinição
        String link = frontendResetUrl + "?token=" + token;

        // Envia e-mail simples
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("DocScriptum - Redefinição de acesso");
        msg.setText("""
                Olá,

                Recebemos uma solicitação para redefinir sua senha/acesso no DocScriptum.

                Para continuar, acesse o link abaixo:

                %s

                Se você não fez esta solicitação, ignore este e-mail.

                Atenciosamente,
                DocScriptum
                """.formatted(link)
        );

        mailSender.send(msg);

        return ResponseEntity.ok(Map.of(
                "message", "Se o e-mail estiver cadastrado, enviaremos instruções para redefinição."
        ));
    }

    // ===== NOVO: APLICA NOVA SENHA (E OPCIONALMENTE NOVO USERNAME) =====

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDTO dto) {
        String token = dto.token().trim();

        PasswordResetToken resetToken = resetTokenRepo.findByToken(token)
                .orElse(null);

        if (resetToken == null ||
                resetToken.isUsed() ||
                resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Token de redefinição inválido ou expirado.");
        }

        AppUser user = resetToken.getUser();

        // Atualiza senha
        user.setPassword(encoder.encode(dto.newPassword()));

        // Se veio novo usuário, atualiza também (validar duplicidade se quiser)
        if (dto.newUsername() != null && !dto.newUsername().isBlank()) {
            String newUsername = dto.newUsername().trim();
            // se quiser, checa se já existe
            if (!newUsername.equalsIgnoreCase(user.getUsername()) &&
                    userRepo.existsByUsernameIgnoreCase(newUsername)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Já existe um usuário com esse username.");
            }
            user.setUsername(newUsername);
        }

        userRepo.save(user);

        // marca token como utilizado
        resetToken.setUsed(true);
        resetTokenRepo.save(resetToken);

        return ResponseEntity.ok(Map.of(
                "message", "Senha redefinida com sucesso."
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
