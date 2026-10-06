package com.example.user_service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/sync")
    public User syncUser(@RequestBody User user) {
        User existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser != null) {
            existingUser.setName(user.getName());
            if (user.getRole() != null && !user.getRole().isBlank()) {
                existingUser.setRole(user.getRole());
            }
            return userRepository.save(existingUser);
        }
        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("USER");
        }
        return userRepository.save(user);
    }
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable String id) {
        return userRepository.findById(id).orElse(null);
    }
}
