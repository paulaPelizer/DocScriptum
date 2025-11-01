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

/**
 * Filtro JWT:
 * - Ignora rotas públicas e preflight CORS
 * - Não retorna 401/403 se o token não for enviado
 * - Autentica apenas se houver um Bearer token válido
 */
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

        // 1) Ignorar preflight (CORS)
        if (HttpMethod.OPTIONS.matches(req.getMethod())) {
            chain.doFilter(req, res);
            return;
        }

        // 2) Ignorar endpoints públicos (mesma lógica do SecurityConfig)
        final String path = req.getServletPath();
        final String method = req.getMethod();
        if (isPublic(path, method)) {
            chain.doFilter(req, res);
            return;
        }

        // 3) Tentar autenticar SOMENTE se houver Authorization: Bearer ...
        String auth = req.getHeader("Authorization");
        if (!StringUtils.hasText(auth) || !auth.startsWith("Bearer ")) {
            // Sem header -> segue sem autenticar (SecurityConfig decide)
            chain.doFilter(req, res);
            return;
        }

        String token = auth.substring(7);
        try {
            String username = jwtService.extractUsername(token);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails user = userDetailsService.loadUserByUsername(username);
                if (jwtService.isValid(token, user)) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            user, null, user.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ignored) {
            // Token inválido/expirado: não falha aqui; deixa a autorização decidir adiante
        }

        // 4) Segue o fluxo
        chain.doFilter(req, res);
    }

    /**
     * Rotas públicas espelhadas do SecurityConfig.
     * Durante o DEV, clients/projects estão totalmente liberados (qualquer método).
     */
    private boolean isPublic(String path, String method) {
        if (path == null) return true;

        // Públicos gerais
        if (path.startsWith("/api/v1/auth")
            || path.equals("/api/v1/health")
            || path.equals("/actuator/health")
            || path.startsWith("/v3/api-docs")
            || path.startsWith("/swagger-ui")
            || path.equals("/swagger-ui.html")) {
            return true;
        }

        // GETs públicos
        if ("GET".equalsIgnoreCase(method) &&
                (path.startsWith("/api/v1/projects")
              || path.startsWith("/api/v1/clients")
              || path.startsWith("/api/v1/orgs"))) {
            return true;
        }

        // DEV: liberar qualquer método para clients/projects (espelha SecurityConfig)
        if (path.startsWith("/api/v1/clients") || path.startsWith("/api/v1/projects")) {
            return true;
        }

        return false;
    }
}
