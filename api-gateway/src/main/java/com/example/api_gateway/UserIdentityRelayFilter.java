package com.example.api_gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class UserIdentityRelayFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        // Step 1: Always sanitize untrusted client headers
        ServerWebExchange.Builder requestBuilder = exchange.mutate()
            .request(builder -> builder.headers(h -> {
                h.remove("X-User-Email");
                h.remove("X-User-Name");
                h.remove("X-User-Role");
            }));
        ServerWebExchange sanitizedExchange = requestBuilder.build();

        // Step 2: Extract identity from ReactiveSecurityContextHolder or exchange principal
        return ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .switchIfEmpty(sanitizedExchange.getPrincipal().cast(Authentication.class))
            .flatMap(auth -> {
                String email = null;
                String name = null;
                String role = "USER";

                if (auth instanceof OAuth2AuthenticationToken oauthToken) {
                    OAuth2User user = oauthToken.getPrincipal();
                    email = user.getAttribute("email");
                    name = user.getAttribute("name");
                    role = AuthController.resolveRoleForEmail(email);
                } else if (auth != null && auth.isAuthenticated()) {
                    name = auth.getName();
                    email = name.contains("@") ? name : name + "@example.com";
                    role = AuthController.resolveRoleForEmail(email);
                }

                if (email != null && !email.isBlank()) {
                    final String finalEmail = email;
                    final String finalName = name != null ? name : email;
                    final String finalRole = role;
                    ServerWebExchange mutated = sanitizedExchange.mutate()
                        .request(builder -> builder.headers(h -> {
                            h.set("X-User-Email", finalEmail);
                            h.set("X-User-Name", finalName);
                            h.set("X-User-Role", finalRole);
                        }))
                        .build();
                    return chain.filter(mutated);
                }
                return chain.filter(sanitizedExchange);
            })
            .switchIfEmpty(Mono.defer(() -> {
                // If not session-authenticated, check for test dev bearer token
                if (authHeader != null && authHeader.startsWith("Bearer dev-token-")) {
                    String token = authHeader.substring(17);
                    String role = "USER";
                    String username = "user1";
                    if (token.contains("admin")) {
                        role = "ADMIN";
                        username = "admin1";
                    } else if (token.contains("dev")) {
                        role = "DEVELOPER";
                        username = "dev1";
                    }
                    String finalUsername = username;
                    String finalRole = role;
                    ServerWebExchange devMutated = sanitizedExchange.mutate()
                        .request(builder -> builder.headers(h -> {
                            h.set("X-User-Email", finalUsername + "@example.com");
                            h.set("X-User-Name", finalUsername);
                            h.set("X-User-Role", finalRole);
                        }))
                        .build();
                    return chain.filter(devMutated);
                }
                return chain.filter(sanitizedExchange);
            }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
