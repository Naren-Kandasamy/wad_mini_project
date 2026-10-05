package com.example.order_service;
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
