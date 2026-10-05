import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# ----------------- PRODUCT SERVICE -----------------
product_application_yml = """server:
  port: 8082
spring:
  application:
    name: product-service
  data:
    mongodb:
      uri: mongodb://mongodb:27017/product_db
"""
write_file('product-service/src/main/resources/application.yml', product_application_yml)
if os.path.exists('product-service/src/main/resources/application.properties'):
    os.remove('product-service/src/main/resources/application.properties')

product_model = """package com.example.product_service;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
public class Product {
    @Id
    private String id;
    private String name;
    private String description;
    private double price;
    private String imageUrl;

    public Product() {}
    public Product(String name, String description, double price, String imageUrl) {
        this.name = name; this.description = description; this.price = price; this.imageUrl = imageUrl;
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
"""
write_file('product-service/src/main/java/com/example/product_service/Product.java', product_model)

product_repo = """package com.example.product_service;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface ProductRepository extends MongoRepository<Product, String> {}
"""
write_file('product-service/src/main/java/com/example/product_service/ProductRepository.java', product_repo)

product_controller = """package com.example.product_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }
    
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable String id) {
        return productRepository.findById(id).orElse(null);
    }
}
"""
write_file('product-service/src/main/java/com/example/product_service/ProductController.java', product_controller)


# ----------------- USER SERVICE -----------------
user_application_yml = """server:
  port: 8081
spring:
  application:
    name: user-service
  data:
    mongodb:
      uri: mongodb://mongodb:27017/user_db
"""
write_file('user-service/src/main/resources/application.yml', user_application_yml)
if os.path.exists('user-service/src/main/resources/application.properties'):
    os.remove('user-service/src/main/resources/application.properties')

user_model = """package com.example.user_service;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String name;

    public User() {}
    public User(String email, String name) {
        this.email = email; this.name = name;
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
"""
write_file('user-service/src/main/java/com/example/user_service/User.java', user_model)

user_repo = """package com.example.user_service;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface UserRepository extends MongoRepository<User, String> {
    User findByEmail(String email);
}
"""
write_file('user-service/src/main/java/com/example/user_service/UserRepository.java', user_repo)

user_controller = """package com.example.user_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/sync")
    public User syncUser(@RequestBody User user) {
        User existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser != null) {
            existingUser.setName(user.getName());
            return userRepository.save(existingUser);
        }
        return userRepository.save(user);
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable String id) {
        return userRepository.findById(id).orElse(null);
    }
}
"""
write_file('user-service/src/main/java/com/example/user_service/UserController.java', user_controller)


# ----------------- CART SERVICE -----------------
cart_application_yml = """server:
  port: 8083
spring:
  application:
    name: cart-service
  data:
    mongodb:
      uri: mongodb://mongodb:27017/cart_db
"""
write_file('cart-service/src/main/resources/application.yml', cart_application_yml)
if os.path.exists('cart-service/src/main/resources/application.properties'):
    os.remove('cart-service/src/main/resources/application.properties')

cart_model = """package com.example.cart_service;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "carts")
public class Cart {
    @Id
    private String id;
    private String userEmail;
    private List<CartItem> items = new ArrayList<>();

    public Cart() {}
    public Cart(String userEmail) { this.userEmail = userEmail; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }
}
"""
write_file('cart-service/src/main/java/com/example/cart_service/Cart.java', cart_model)

cart_item_model = """package com.example.cart_service;

public class CartItem {
    private String productId;
    private String productName;
    private int quantity;
    private double price;

    public CartItem() {}
    public CartItem(String productId, String productName, int quantity, double price) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
    }

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
"""
write_file('cart-service/src/main/java/com/example/cart_service/CartItem.java', cart_item_model)

cart_repo = """package com.example.cart_service;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CartRepository extends MongoRepository<Cart, String> {
    Optional<Cart> findByUserEmail(String userEmail);
}
"""
write_file('cart-service/src/main/java/com/example/cart_service/CartRepository.java', cart_repo)

cart_controller = """package com.example.cart_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    @Autowired
    private CartRepository cartRepository;

    @GetMapping("/{email}")
    public Cart getCart(@PathVariable String email) {
        return cartRepository.findByUserEmail(email).orElseGet(() -> {
            Cart newCart = new Cart(email);
            return cartRepository.save(newCart);
        });
    }

    @PostMapping("/{email}/add")
    public Cart addToCart(@PathVariable String email, @RequestBody CartItem item) {
        Cart cart = getCart(email);
        boolean found = false;
        for (CartItem ci : cart.getItems()) {
            if (ci.getProductId().equals(item.getProductId())) {
                ci.setQuantity(ci.getQuantity() + item.getQuantity());
                found = true;
                break;
            }
        }
        if (!found) {
            cart.getItems().add(item);
        }
        return cartRepository.save(cart);
    }
    
    @DeleteMapping("/{email}/remove/{productId}")
    public Cart removeFromCart(@PathVariable String email, @PathVariable String productId) {
        Cart cart = getCart(email);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return cartRepository.save(cart);
    }
    
    @DeleteMapping("/{email}/clear")
    public void clearCart(@PathVariable String email) {
        cartRepository.findByUserEmail(email).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }
}
"""
write_file('cart-service/src/main/java/com/example/cart_service/CartController.java', cart_controller)


# ----------------- ORDER SERVICE -----------------
order_application_yml = """server:
  port: 8084
spring:
  application:
    name: order-service
  data:
    mongodb:
      uri: mongodb://mongodb:27017/order_db
"""
write_file('order-service/src/main/resources/application.yml', order_application_yml)
if os.path.exists('order-service/src/main/resources/application.properties'):
    os.remove('order-service/src/main/resources/application.properties')

order_model = """package com.example.order_service;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.Date;

@Document(collection = "orders")
public class Order {
    @Id
    private String id;
    private String userEmail;
    private List<OrderItem> items;
    private double totalAmount;
    private Date orderDate;
    private String status;

    public Order() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }
    public Date getOrderDate() { return orderDate; }
    public void setOrderDate(Date orderDate) { this.orderDate = orderDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
"""
write_file('order-service/src/main/java/com/example/order_service/Order.java', order_model)

order_item_model = """package com.example.order_service;

public class OrderItem {
    private String productId;
    private String productName;
    private int quantity;
    private double price;

    public OrderItem() {}

    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
}
"""
write_file('order-service/src/main/java/com/example/order_service/OrderItem.java', order_item_model)

order_repo = """package com.example.order_service;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserEmail(String userEmail);
}
"""
write_file('order-service/src/main/java/com/example/order_service/OrderRepository.java', order_repo)

order_controller = """package com.example.order_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Date;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/{email}")
    public List<Order> getOrders(@PathVariable String email) {
        return orderRepository.findByUserEmail(email);
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        order.setOrderDate(new Date());
        order.setStatus("PLACED");
        return orderRepository.save(order);
    }
}
"""
write_file('order-service/src/main/java/com/example/order_service/OrderController.java', order_controller)


# ----------------- API GATEWAY -----------------
gateway_application_yml = """server:
  port: 8080
spring:
  application:
    name: api-gateway
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:change-me}
            client-secret: ${GOOGLE_CLIENT_SECRET:change-me}
            scope: email, profile
  cloud:
    gateway:
      default-filters:
        - TokenRelay
      routes:
        - id: product-service
          uri: http://product-service:8082
          predicates:
            - Path=/api/products/**
        - id: user-service
          uri: http://user-service:8081
          predicates:
            - Path=/api/users/**
        - id: cart-service
          uri: http://cart-service:8083
          predicates:
            - Path=/api/cart/**
        - id: order-service
          uri: http://order-service:8084
          predicates:
            - Path=/api/orders/**
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins: "http://localhost:80"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
            allowedHeaders: "*"
            allowCredentials: true
"""
write_file('api-gateway/src/main/resources/application.yml', gateway_application_yml)
if os.path.exists('api-gateway/src/main/resources/application.properties'):
    os.remove('api-gateway/src/main/resources/application.properties')

gateway_security = """package com.example.api_gateway;
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
"""
write_file('api-gateway/src/main/java/com/example/api_gateway/SecurityConfig.java', gateway_security)

gateway_user_controller = """package com.example.api_gateway;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class AuthController {

    @GetMapping("/api/me")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return Map.of("authenticated", false);
        }
        return Map.of(
            "authenticated", true,
            "name", principal.getAttribute("name"),
            "email", principal.getAttribute("email"),
            "picture", principal.getAttribute("picture")
        );
    }
}
"""
write_file('api-gateway/src/main/java/com/example/api_gateway/AuthController.java', gateway_user_controller)

print("Backend setup complete.")
