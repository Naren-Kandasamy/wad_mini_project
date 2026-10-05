package com.example.order_service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping({"", "/me", "/{email}"})
    public List<Order> getOrders(
            @PathVariable(required = false) String email,
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail) {
        String effectiveEmail = headerEmail;
        if (effectiveEmail != null && !effectiveEmail.isBlank()) {
            if (email != null && !email.equalsIgnoreCase("me") && !email.equalsIgnoreCase(effectiveEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Cannot view another user's orders");
            }
        } else {
            effectiveEmail = email;
        }

        if (effectiveEmail == null || effectiveEmail.isBlank() || effectiveEmail.equalsIgnoreCase("me")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User identity not found in request");
        }

        return orderRepository.findByUserEmail(effectiveEmail);
    }

    @PostMapping({"", "/checkout"})
    public Order createOrder(
            @RequestHeader(value = "X-User-Email", required = false) String headerEmail,
            @RequestBody Order order) {
        // Enforce user identity from trusted header if available
        if (headerEmail != null && !headerEmail.isBlank()) {
            order.setUserEmail(headerEmail);
        } else if (order.getUserEmail() == null || order.getUserEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User email is required to place an order");
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must contain at least one item");
        }

        // Server-authoritative total calculation: Never trust client-submitted totalAmount
        double calculatedTotal = 0.0;
        for (OrderItem item : order.getItems()) {
            if (item.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item quantity must be greater than zero");
            }
            calculatedTotal += item.getPrice() * item.getQuantity();
        }
        order.setTotalAmount(Math.round(calculatedTotal * 100.0) / 100.0);
        order.setOrderDate(new Date());
        order.setStatus("PLACED");

        return orderRepository.save(order);
    }
}
