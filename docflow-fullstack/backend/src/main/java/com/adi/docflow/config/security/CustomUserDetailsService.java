// src/main/java/com/adi/docflow/config/security/CustomUserDetailsService.java
package com.adi.docflow.config.security;

import com.adi.docflow.model.AppUser;
import com.adi.docflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Primary
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    // tokens de cadastro vindos do application.yml
    private final String dbaToken;
    private final String adminToken;
    private final String resourceToken;

    public CustomUserDetailsService(
            UserRepository userRepo,
            PasswordEncoder encoder,
            @Value("${app.signup.token-dba:}") String dbaToken,
            @Value("${app.signup.token-admin:}") String adminToken,
            @Value("${app.signup.token-resource:}") String resourceToken
    ) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.dbaToken = dbaToken;
        this.adminToken = adminToken;
        this.resourceToken = resourceToken;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // 1) Tenta buscar o usuário real na tabela app_user
        Optional<AppUser> opt = userRepo.findByUsernameIgnoreCase(username);

        if (opt.isPresent()) {
            Object entity = opt.get();

            // Se a entidade já implementa UserDetails, usamos direto
            if (entity instanceof UserDetails ud) {
                return ud;
            }

            // Tenta extrair via getters "normais": getUsername(), getPassword(), getRoles()
            String u = username;
            String p = null;
            String rolesRaw = null;

            try {
                // username
                try {
                    Method mUser = entity.getClass().getMethod("getUsername");
                    Object v = mUser.invoke(entity);
                    if (v instanceof String s && !s.isBlank()) {
                        u = s;
                    }
                } catch (NoSuchMethodException ignore) {
                    // se não tiver getUsername, mantemos o username passado
                }

                // password
                try {
                    Method mPass = entity.getClass().getMethod("getPassword");
                    Object v = mPass.invoke(entity);
                    if (v instanceof String s && !s.isBlank()) {
                        p = s;
                    }
                } catch (NoSuchMethodException ignore) {
                    // se não tiver getPassword, tratamos abaixo
                }

                // roles (ex.: "DBA,ADMIN" ou "ROLE_ADMIN,ROLE_RESOURCE")
                try {
                    Method mRoles = entity.getClass().getMethod("getRoles");
                    Object v = mRoles.invoke(entity);
                    if (v instanceof String s && !s.isBlank()) {
                        rolesRaw = s;
                    }
                } catch (NoSuchMethodException ignore) {
                    // ainda não tem campo de roles? então cai no default ROLE_USER
                }

            } catch (Exception e) {
                throw new UsernameNotFoundException("Falha ao ler dados do usuário", e);
            }

            // Se a senha não vier do banco (nulo ou vazia), usamos um fallback (dev only)
            if (p == null || p.isBlank()) {
                p = encoder.encode("admin");
            }

            // Converte roles em authorities; se não tiver, aplica ROLE_USER
            List<GrantedAuthority> authorities = parseRolesOrDefault(rolesRaw);

            return org.springframework.security.core.userdetails.User
                    .withUsername(u != null ? u : username)
                    .password(p)
                    .authorities(authorities)
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(false)
                    .build();
        }

        // 2) Fallback: usuário embutido de desenvolvimento (apenas se não achar no banco)
        String demoUser = "admin@docflow";
        String demoPass = encoder.encode("admin");

        return org.springframework.security.core.userdetails.User
                .withUsername(demoUser)
                .password(demoPass)
                // Todos os perfis para o fallback
                .roles("DBA", "ADMIN", "RESOURCE")
                .build();
    }

    /**
     * Cadastro de novo usuário a partir de um token de autorização.
     * - Gera roles com base no token
     * - Cripta a senha
     * - Salva em app_user
     */
    public AppUser registerUser(String username, String rawPassword, String token) {

        // 1) valida username único
        if (userRepo.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Já existe um usuário com esse e-mail/username.");
        }

        // 2) valida token e define roles
        String rolesStr = resolveRolesFromToken(token);
        if (rolesStr == null) {
            throw new IllegalArgumentException("Token de autorização inválido.");
        }

        // 3) cria entidade AppUser
        AppUser user = new AppUser();
        user.setUsername(username.trim());
        user.setPassword(encoder.encode(rawPassword));
        user.setEnabled(true);
        user.setRoles(rolesStr); // ex.: "DBA,ADMIN,RESOURCE"

        // 4) salva
        return userRepo.save(user);
    }

    /**
     * Mapeia o token → string de roles para gravar na coluna app_user.roles
     */
    private String resolveRolesFromToken(String token) {
        if (token == null || token.isBlank()) return null;
        String t = token.trim();

        if (!dbaToken.isBlank() && t.equals(dbaToken)) {
            // DBA tem todos os perfis
            return "DBA,ADMIN,RESOURCE";
        }
        if (!adminToken.isBlank() && t.equals(adminToken)) {
            // ADMIN + RESOURCE
            return "ADMIN,RESOURCE";
        }
        if (!resourceToken.isBlank() && t.equals(resourceToken)) {
            // apenas RESOURCE
            return "RESOURCE";
        }
        return null;
    }

    /**
     * Converte uma string de roles (ex.: "DBA,ADMIN" ou "ROLE_ADMIN,ROLE_RESOURCE")
     * em uma lista de GrantedAuthority. Se vazio/nulo, devolve ROLE_USER.
     */
    private List<GrantedAuthority> parseRolesOrDefault(String rawRoles) {
        List<GrantedAuthority> authorities = parseRoles(rawRoles);
        if (authorities.isEmpty()) {
            return List.of(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return authorities;
    }

    /**
     * Converte a string de roles em authorities, sem default.
     */
    private List<GrantedAuthority> parseRoles(String rawRoles) {
        if (rawRoles == null || rawRoles.isBlank()) {
            return List.of();
        }

        return Arrays.stream(rawRoles.split("[,;\\s]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(role -> {
                    String r = role.toUpperCase(Locale.ROOT);
                    if (!r.startsWith("ROLE_")) {
                        r = "ROLE_" + r;
                    }
                    return new SimpleGrantedAuthority(r);
                })
                .distinct()
                .collect(Collectors.toList());
    }
}
