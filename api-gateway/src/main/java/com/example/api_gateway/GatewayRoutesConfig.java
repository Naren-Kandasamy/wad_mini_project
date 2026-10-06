package com.example.api_gateway;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayRoutesConfig {

    @Value("${PRODUCT_SERVICE_URL:http://localhost:8082}")
    private String productServiceUrl;

    @Value("${USER_SERVICE_URL:http://localhost:8081}")
    private String userServiceUrl;

    @Value("${CART_SERVICE_URL:http://localhost:8083}")
    private String cartServiceUrl;

    @Value("${ORDER_SERVICE_URL:http://localhost:8084}")
    private String orderServiceUrl;

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("product-service", r -> r.path("/api/products/**", "/api/products")
                .uri(productServiceUrl))
            .route("user-service", r -> r.path("/api/users/**", "/api/users")
                .uri(userServiceUrl))
            .route("cart-service", r -> r.path("/api/cart/**", "/api/cart", "/api/carts/**", "/api/carts")
                .uri(cartServiceUrl))
            .route("order-service", r -> r.path("/api/orders/**", "/api/orders")
                .uri(orderServiceUrl))
            .build();
    }
}
