package com.example.api_gateway;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
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

        // Step 2: Inject authenticated identity if present
        return sanitizedExchange.getPrincipal()
            .cast(Authentication.class)
            .flatMap(auth -> {
                if (auth instanceof OAuth2AuthenticationToken oauthToken) {
                    OAuth2User user = oauthToken.getPrincipal();
                    String email = user.getAttribute("email");
                    String name = user.getAttribute("name");
                    String role = AuthController.resolveRoleForEmail(email);

                    ServerWebExchange mutated = sanitizedExchange.mutate()
                        .request(builder -> builder.headers(h -> {
                            if (email != null) {
                                h.set("X-User-Email", email);
                            }
                            if (name != null) {
                                h.set("X-User-Name", name);
                            }
                            h.set("X-User-Role", role);
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
