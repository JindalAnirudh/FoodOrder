package com.foodapp.food_ordering_backend.config;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // Enable CORS with default configuration
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public authentication endpoints
                .requestMatchers("/auth/**").permitAll()
                // Static resources and pages
                .requestMatchers("/static/**", "/css/**", "/js/**", "/favicon.ico").permitAll()
                .requestMatchers("/", "/index.html", "/login.html", "/register.html").permitAll()
                // Public API endpoints
                .requestMatchers("/foods", "/foods/{id}").permitAll()
                // Admin-only endpoints
                .requestMatchers("/api/admin/**", "/foods/{id}/can-delete", "/foods/{id}/order-status").hasRole("ADMIN")
                .requestMatchers("/users/**").hasRole("ADMIN")
                // Protected endpoints requiring authentication
                .requestMatchers("/api/**", "/orders/**").authenticated()
                // Allow all other requests for now (can be restricted later)
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
