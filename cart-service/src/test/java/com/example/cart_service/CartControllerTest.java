package com.example.cart_service;

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
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CartRepository cartRepository;

    @BeforeEach
    void setUp() {
        cartRepository.deleteAll();
    }

    @Test
    void testGetEmptyCart() throws Exception {
        mockMvc.perform(get("/api/cart/me")
                .header("X-User-Email", "alice@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userEmail", is("alice@example.com")))
                .andExpect(jsonPath("$.items", hasSize(0)));
    }

    @Test
    void testAddItemAndIncrementQuantity() throws Exception {
        String itemPayload = """
            {
                "productId": "p100",
                "productName": "Gaming Keyboard",
                "quantity": 1,
                "price": 89.99
            }
            """;

        mockMvc.perform(post("/api/cart/me/items")
                .header("X-User-Email", "bob@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(itemPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].quantity", is(1)));

        // Add the same item again - should increment quantity to 2
        mockMvc.perform(post("/api/cart/me/items")
                .header("X-User-Email", "bob@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(itemPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].quantity", is(2)));
    }

    @Test
    void testRemoveItemAndClearCart() throws Exception {
        String itemPayload = """
            {
                "productId": "p200",
                "productName": "USB Cable",
                "quantity": 3,
                "price": 9.99
            }
            """;

        mockMvc.perform(post("/api/cart/me/items")
                .header("X-User-Email", "charlie@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(itemPayload))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/cart/me/items/p200")
                .header("X-User-Email", "charlie@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)));
    }

    @Test
    void testIdorProtectionRejectsMismatchedUser() throws Exception {
        mockMvc.perform(get("/api/cart/victim@example.com")
                .header("X-User-Email", "attacker@example.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testPluralCartsRouteAndPutQuantity() throws Exception {
        String itemPayload = """
            {
                "productId": "p300",
                "productName": "Webcam",
                "quantity": 1,
                "price": 45.00
            }
            """;

        mockMvc.perform(post("/api/carts/me/items")
                .header("X-User-Email", "dave@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(itemPayload))
                .andExpect(status().isOk());

        String updatePayload = """
            {
                "quantity": 5
            }
            """;

        mockMvc.perform(put("/api/carts/me/items/p300")
                .header("X-User-Email", "dave@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.subtotal", is(225.0)));
    }
}
