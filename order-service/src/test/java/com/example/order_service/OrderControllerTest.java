package com.example.order_service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
    }

    @Test
    void testCreateOrderComputesTotalServerSide() throws Exception {
        // Client attempts to send totalAmount: 0.01 (malicious price tampering)
        // Backend must override it with (2 * 50.0) + (1 * 25.5) = 125.50
        String orderPayload = """
            {
                "items": [
                    {
                        "productId": "p1",
                        "productName": "Item 1",
                        "quantity": 2,
                        "price": 50.0
                    },
                    {
                        "productId": "p2",
                        "productName": "Item 2",
                        "quantity": 1,
                        "price": 25.50
                    }
                ],
                "totalAmount": 0.01
            }
            """;

        mockMvc.perform(post("/api/orders/checkout")
                .header("X-User-Email", "shopper@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(orderPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.userEmail", is("shopper@example.com")))
                .andExpect(jsonPath("$.totalAmount", is(125.50)))
                .andExpect(jsonPath("$.status", is("PLACED")));

        mockMvc.perform(get("/api/orders/me")
                .header("X-User-Email", "shopper@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].totalAmount", is(125.50)));
    }

    @Test
    void testOrderFailsWithEmptyItems() throws Exception {
        String invalidPayload = """
            {
                "items": []
            }
            """;

        mockMvc.perform(post("/api/orders/checkout")
                .header("X-User-Email", "shopper@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testOrderIdorProtection() throws Exception {
        mockMvc.perform(get("/api/orders/victim@example.com")
                .header("X-User-Email", "attacker@example.com"))
                .andExpect(status().isForbidden());
    }
}
