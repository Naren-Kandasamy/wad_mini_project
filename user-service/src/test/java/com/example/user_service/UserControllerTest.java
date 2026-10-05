package com.example.user_service;

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
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void testSyncUserCreateAndUpsert() throws Exception {
        String payload1 = """
            {
                "email": "dev@example.com",
                "name": "Initial Name"
            }
            """;

        mockMvc.perform(post("/api/users/sync")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.email", is("dev@example.com")))
                .andExpect(jsonPath("$.name", is("Initial Name")));

        // Update name for same email
        String payload2 = """
            {
                "email": "dev@example.com",
                "name": "Updated Name"
            }
            """;

        mockMvc.perform(post("/api/users/sync")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Name")));
    }
}
