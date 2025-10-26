package com.adi.docflow.config.security;

import com.adi.docflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;

@Service
@Primary
public class CustomUserDetailsService implements UserDetailsService {

    private final PasswordEncoder encoder;

    // Torna o repositorio de autenticacao opcional por enquanto
    @Autowired(required = false)
    private UserRepository userRepo;

    public CustomUserDetailsService(PasswordEncoder encoder) {
        this.encoder = encoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // PREPARAÇÃO PARA tentar buscar do banco
        if (userRepo != null) {
            Optional<?> opt = userRepo.findByUsernameIgnoreCase(username).map(u -> (Object) u);


            if (opt.isPresent()) {
                Object entity = opt.get();

                // Se entidade já implementa com UserDetails, usa direto
                if (entity instanceof UserDetails ud) {
                    return ud;
                }

                // Tentar extrair via métodos comuns: getUsername()/getPassword()
                try {
                    Method getUser = entity.getClass().getMethod("getUsername");
                    Method getPass = entity.getClass().getMethod("getPassword");

                    String u = (String) getUser.invoke(entity);
                    String p = (String) getPass.invoke(entity);

                    // Se vier nulo/vazio, aplica um fallback (apenas para dev)
                    if (p == null || p.isBlank()) {
                        p = encoder.encode("admin");
                    }

                    // Autoridade padrão; ajustar quando tiver papéis na entidade
                    List<SimpleGrantedAuthority> auths =
                            List.of(new SimpleGrantedAuthority("ROLE_USER"));

                    return org.springframework.security.core.userdetails.User
                            .withUsername(u != null ? u : username)
                            .password(p)
                            .authorities(auths)
                            .accountExpired(false)
                            .accountLocked(false)
                            .credentialsExpired(false)
                            .disabled(false)
                            .build();

                } catch (Exception ignore) {
                    // Se não tiver esses getters, caí no fallback abaixo
                }
            }
        }

        // 2) Fallback = usuário embutido para desenvolvimento
        //    (alternativa provisória para evitar o 403, até criar o modelo de usuário)
        String u = "admin@docflow";
        String p = encoder.encode("admin");
        return org.springframework.security.core.userdetails.User
                .withUsername(u)
                .password(p)
                .roles("ADMIN")
                .build();
    }
}
