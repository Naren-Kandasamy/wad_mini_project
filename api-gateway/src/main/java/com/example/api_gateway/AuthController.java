package com.example.api_gateway;
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
        java.util.Map<String, Object> details = new java.util.HashMap<>();
        details.put("authenticated", true);
        details.put("name", principal.getAttribute("name") != null ? principal.getAttribute("name") : "");
        details.put("email", principal.getAttribute("email") != null ? principal.getAttribute("email") : "");
        details.put("picture", principal.getAttribute("picture") != null ? principal.getAttribute("picture") : "");
        return details;
    }
}
