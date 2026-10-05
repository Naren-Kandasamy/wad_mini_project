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
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints
                .pathMatchers("/api/products/**").permitAll()
                // Any other endpoint requires authentication
                .anyExchange().authenticated()
            )
            .oauth2Login(oauth2 -> {})
            .logout(logout -> logout
                .logoutUrl("/api/logout")
                .logoutSuccessHandler((exchange, authentication) -> {
                     return exchange.getExchange().getResponse().setComplete();
                })
            );
        return http.build();
    }
}
