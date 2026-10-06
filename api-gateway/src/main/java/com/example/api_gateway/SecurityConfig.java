package com.example.api_gateway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost*",
            "http://127.0.0.1*",
            "https://*.vercel.app",
            "https://*.onrender.com"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setExposedHeaders(Arrays.asList("Authorization", "X-User-Role", "X-User-Email", "X-Request-Id"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        String frontendRedirect = System.getenv().getOrDefault("FRONTEND_URL", "http://localhost/");
        if (!frontendRedirect.endsWith("/")) {
            frontendRedirect += "/";
        }

        final String targetRedirectUrl = frontendRedirect;

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeExchange(exchanges -> exchanges
                // Preflight OPTIONS requests must never be blocked by security
                .pathMatchers(org.springframework.http.HttpMethod.OPTIONS).permitAll()
                // Public endpoints
                .pathMatchers("/api/me", "/api/products/**").permitAll()
                // Any other endpoint requires authentication
                .anyExchange().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authenticationSuccessHandler((webFilterExchange, authentication) -> {
                    webFilterExchange.getExchange().getResponse().setStatusCode(org.springframework.http.HttpStatus.FOUND);
                    webFilterExchange.getExchange().getResponse().getHeaders().setLocation(java.net.URI.create(targetRedirectUrl));
                    return webFilterExchange.getExchange().getResponse().setComplete();
                })
            )
            .logout(logout -> logout
                .logoutUrl("/api/logout")
                .logoutSuccessHandler((exchange, authentication) -> {
                     return exchange.getExchange().getResponse().setComplete();
                })
            );
        return http.build();
    }
}
