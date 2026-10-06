package com.example.product_service;

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
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
    }

    @Test
    void testCreateAndGetProduct() throws Exception {
        String payload = """
            {
                "name": "Wireless Mouse",
                "description": "Ergonomic 2.4G wireless mouse",
                "price": 25.50,
                "imageUrl": "http://example.com/mouse.png"
            }
            """;

        mockMvc.perform(post("/api/products")
                .header("X-User-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Wireless Mouse")))
                .andExpect(jsonPath("$.price", is(25.50)));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Wireless Mouse")));
    }

    @Test
    void testGetProductNotFound() throws Exception {
        mockMvc.perform(get("/api/products/non-existent-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void testCreateProductForbiddenForUserRole() throws Exception {
        String payload = """
            {
                "name": "Mechanical Keyboard",
                "price": 120.0
            }
            """;

        mockMvc.perform(post("/api/products")
                .header("X-User-Role", "USER")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateProductInvalidValidation() throws Exception {
        String invalidPayload = """
            {
                "name": "",
                "price": -10.0
            }
            """;

        mockMvc.perform(post("/api/products")
                .header("X-User-Role", "ADMIN")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }
}
