package com.example.api_gateway;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class AuthController {

    public static String resolveRoleForEmail(String email) {
        if (email == null) return "USER";
        String lower = email.toLowerCase().trim();
        if (lower.equals("naren2.karthik2005@gmail.com") || lower.startsWith("admin")) {
            return "ADMIN";
        }
        if (lower.equals("nitin2470025@ssn.edu.in") || lower.equals("nitin.harish21@gmail.com") || lower.startsWith("dev")) {
            return "DEVELOPER";
        }
        return "USER";
    }

    @GetMapping("/api/me")
    public Map<String, Object> getCurrentUser(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (principal != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("authenticated", true);
            String email = principal.getAttribute("email") != null ? principal.getAttribute("email") : "";
            String name = principal.getAttribute("name") != null ? principal.getAttribute("name") : "";
            details.put("name", name);
            details.put("email", email);
            details.put("picture", principal.getAttribute("picture") != null ? principal.getAttribute("picture") : "");
            
            String role = resolveRoleForEmail(email);
            details.put("role", role);
            details.put("roles", List.of(role));
            return details;
        }

        // Support for Bearer dev tokens for local/test resilient personas
        if (authHeader != null && authHeader.startsWith("Bearer dev-token-")) {
            String token = authHeader.substring(17);
            String role = "USER";
            String username = "user1";
            if (token.contains("admin")) {
                role = "ADMIN";
                username = "admin1";
            } else if (token.contains("dev")) {
                role = "DEVELOPER";
                username = "dev1";
            }
            Map<String, Object> details = new HashMap<>();
            details.put("authenticated", true);
            details.put("name", username);
            details.put("email", username + "@example.com");
            details.put("role", role);
            details.put("roles", List.of(role));
            return details;
        }

        return Map.of("authenticated", false);
    }
}
