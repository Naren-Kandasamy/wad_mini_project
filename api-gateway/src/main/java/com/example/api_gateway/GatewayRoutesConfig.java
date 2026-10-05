package com.example.api_gateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("product-service", r -> r.path("/api/products/**", "/api/products")
                .uri("http://product-service:8082"))
            .route("user-service", r -> r.path("/api/users/**", "/api/users")
                .uri("http://user-service:8081"))
            .route("cart-service", r -> r.path("/api/cart/**", "/api/cart")
                .uri("http://cart-service:8083"))
            .route("order-service", r -> r.path("/api/orders/**", "/api/orders")
                .uri("http://order-service:8084"))
            .build();
    }
}
