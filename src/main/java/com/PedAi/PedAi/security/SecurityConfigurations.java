package com.PedAi.PedAi.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
        return httpSecurity
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        // ... (outras permissões permanecem iguais)
                        .requestMatchers(HttpMethod.POST, "/api/clientes/cadastro", "/api/clientes/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pedidos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/pedidos/por-cliente/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/produtos/cardapio", "/api/produtos/categorias")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/", "/index.html", "/html/**", "/css/**", "/js/**", "/img/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/pedidos/importar").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/vendas/registrar").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/relatorios/vendas").hasRole("ADMIN")
                        .requestMatchers("/api/auth/debug/secret").hasRole("ADMIN")
                        .requestMatchers("/h2-console/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/vendas/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/vendas/{id}").hasRole("ADMIN")
                        // Todas as outras rotas exigem autenticação de ADMIN
                        .anyRequest().hasRole("ADMIN"))
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}