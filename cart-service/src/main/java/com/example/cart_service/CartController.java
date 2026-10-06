package com.example.cart_service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping({"/api/cart", "/api/carts"})
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    private String resolveUserEmail(String pathEmail, String headerEmail) {
        if (headerEmail != null && !headerEmail.isBlank()) {
            if (pathEmail != null && !pathEmail.equalsIgnoreCase("me") && !pathEmail.equalsIgnoreCase(headerEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Cannot access another user's cart");
            }
            return headerEmail;
        }
        if (pathEmail != null && !pathEmail.equalsIgnoreCase("me")) {
            return pathEmail;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User identity not found in request");
    }

    @GetMapping({"", "/me", "/{email}"})
    public Cart getCart(
            @PathVariable(required = false) String email,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {
        String userEmail = resolveUserEmail(email, headerEmail);
        return cartRepository.findByUserEmail(userEmail).orElseGet(() -> {
            Cart newCart = new Cart(userEmail);
            return cartRepository.save(newCart);
        });
    }

    @PostMapping({"/items", "/add", "/me/items", "/me/add", "/{email}/add"})
    public Cart addToCart(
            @PathVariable(required = false) String email,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail,
            @RequestBody CartItem item) {
        String userEmail = resolveUserEmail(email, headerEmail);
        Cart cart = getCart(userEmail, headerEmail);
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

    @PutMapping({"/items/{productId}", "/me/items/{productId}", "/{email}/items/{productId}"})
    public Cart updateItemQuantity(
            @PathVariable(required = false) String email,
            @PathVariable String productId,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail,
            @RequestBody CartItem item) {
        String userEmail = resolveUserEmail(email, headerEmail);
        Cart cart = getCart(userEmail, headerEmail);
        for (CartItem ci : cart.getItems()) {
            if (ci.getProductId().equals(productId)) {
                ci.setQuantity(item.getQuantity());
                break;
            }
        }
        return cartRepository.save(cart);
    }

    @DeleteMapping({"/items/{productId}", "/remove/{productId}", "/me/items/{productId}", "/me/remove/{productId}", "/{email}/remove/{productId}"})
    public Cart removeFromCart(
            @PathVariable(required = false) String email,
            @PathVariable String productId,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {
        String userEmail = resolveUserEmail(email, headerEmail);
        Cart cart = getCart(userEmail, headerEmail);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return cartRepository.save(cart);
    }

    @DeleteMapping({"", "/clear", "/me", "/me/clear", "/{email}/clear"})
    public void clearCart(
            @PathVariable(required = false) String email,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {
        String userEmail = resolveUserEmail(email, headerEmail);
        cartRepository.findByUserEmail(userEmail).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }
}
