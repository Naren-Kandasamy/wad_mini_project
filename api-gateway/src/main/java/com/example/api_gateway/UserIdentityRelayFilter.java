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
        // Step 1: Always sanitize untrusted client headers
        ServerWebExchange sanitizedExchange = exchange.mutate()
            .request(builder -> builder.headers(h -> {
                h.remove("X-User-Email");
                h.remove("X-User-Name");
            }))
            .build();

        // Step 2: Inject authenticated identity if present
        return sanitizedExchange.getPrincipal()
            .cast(Authentication.class)
            .flatMap(auth -> {
                if (auth instanceof OAuth2AuthenticationToken oauthToken) {
                    OAuth2User user = oauthToken.getPrincipal();
                    String email = user.getAttribute("email");
                    String name = user.getAttribute("name");

                    ServerWebExchange mutated = sanitizedExchange.mutate()
                        .request(builder -> builder.headers(h -> {
                            if (email != null) {
                                h.set("X-User-Email", email);
                            }
                            if (name != null) {
                                h.set("X-User-Name", name);
                            }
                        }))
                        .build();
                    return chain.filter(mutated);
                }
                return chain.filter(sanitizedExchange);
            })
            .switchIfEmpty(chain.filter(sanitizedExchange));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
