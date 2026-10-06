package com.example.api_gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.server.session.CookieWebSessionIdResolver;
import org.springframework.web.server.session.WebSessionIdResolver;

import org.springframework.web.server.adapter.ForwardedHeaderTransformer;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public ForwardedHeaderTransformer forwardedHeaderTransformer() {
        return new ForwardedHeaderTransformer();
    }

    @Bean
    public WebSessionIdResolver webSessionIdResolver() {
        CookieWebSessionIdResolver resolver = new CookieWebSessionIdResolver();
        resolver.setCookieName("SESSION");
        resolver.addCookieInitializer(builder -> {
            builder.path("/");
            builder.sameSite("Lax");
            builder.secure(true);
            builder.httpOnly(true);
        });
        return resolver;
    }

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
                // Microservices endpoints protected at microservice level via UserIdentityRelayFilter
                .pathMatchers("/api/me", "/api/products/**", "/api/users/**", "/api/cart/**", "/api/carts/**", "/api/orders/**").permitAll()
                // Any other endpoint requires authentication
                .anyExchange().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authenticationSuccessHandler((webFilterExchange, authentication) -> {
                    System.out.println("✅ OAuth2 Login Succeeded for: " + authentication.getName());
                    webFilterExchange.getExchange().getResponse().setStatusCode(org.springframework.http.HttpStatus.FOUND);
                    webFilterExchange.getExchange().getResponse().getHeaders().setLocation(URI.create(targetRedirectUrl));
                    return webFilterExchange.getExchange().getResponse().setComplete();
                })
                .authenticationFailureHandler((webFilterExchange, exception) -> {
                    System.err.println("❌ OAuth2 Login Failure: " + exception.getClass().getName() + ": " + exception.getMessage());
                    if (exception.getCause() != null) {
                        System.err.println("❌ OAuth2 Failure Cause: " + exception.getCause().getClass().getName() + ": " + exception.getCause().getMessage());
                    }
                    String errorMsg = exception.getMessage() != null ? exception.getMessage() : "Authentication failed";
                    String redirect = targetRedirectUrl + "?error=" + URLEncoder.encode(errorMsg, StandardCharsets.UTF_8);
                    webFilterExchange.getExchange().getResponse().setStatusCode(org.springframework.http.HttpStatus.FOUND);
                    webFilterExchange.getExchange().getResponse().getHeaders().setLocation(URI.create(redirect));
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
