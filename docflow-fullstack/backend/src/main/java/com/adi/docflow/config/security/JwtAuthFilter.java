package com.adi.docflow.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, UserDetailsService uds) {
        this.jwtService = jwtService;
        this.userDetailsService = uds;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path = req.getServletPath();
        String method = req.getMethod();

        // 1) Ignora preflight CORS
        if (HttpMethod.OPTIONS.matches(method)) {
            chain.doFilter(req, res);
            return;
        }

        // 2) Rotas públicas → não tenta autenticar
        if (isPublic(path, method)) {
            chain.doFilter(req, res);
            return;
        }

        // 3) Lê Authorization: Bearer <token>
        String auth = req.getHeader("Authorization");
        if (!StringUtils.hasText(auth) || !auth.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        String token = auth.substring(7);

        try {
            String username = jwtService.extractUsername(token);

            if (username != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(req)
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ignored) {
            // Token inválido/expirado → segue como anônimo, quem decide é o SecurityConfig
        }

        chain.doFilter(req, res);
    }

    /**
     * Mesma definição de rotas públicas usada no SecurityConfig.
     */
    private boolean isPublic(String path, String method) {
        if (path == null) return false;

        // Rotas de auth e health
        if (path.startsWith("/api/v1/auth")
                || path.equals("/api/v1/health")
                || path.equals("/actuator/health")) {
            return true;
        }

        // Swagger / OpenAPI
        if (path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.equals("/swagger-ui.html")) {
            return true;
        }

        // Se em algum momento quiser GET público de algo, coloca aqui.
        // Por enquanto, o resto é protegido (tem que vir com JWT).
        return false;
    }
}
