package com.example.cart_service;
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
