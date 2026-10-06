package com.example.product_service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    private void checkAdminOrDevRole(String role) {
        if (role == null || (!role.equalsIgnoreCase("ADMIN") 
                && !role.equalsIgnoreCase("DEVELOPER") 
                && !role.equalsIgnoreCase("ROLE_ADMIN") 
                && !role.equalsIgnoreCase("ROLE_DEVELOPER"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Requires ADMIN or DEVELOPER role");
        }
    }

    @PostMapping
    public Product createProduct(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Product product) {
        checkAdminOrDevRole(role);
        if (product.getName() == null || product.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name cannot be empty");
        }
        if (product.getPrice() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product price cannot be negative");
        }
        return productRepository.save(product);
    }
    
    @GetMapping("/{id}")
    public Product getProductById(@PathVariable String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Product product) {
        checkAdminOrDevRole(role);
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id));
        existing.setName(product.getName());
        existing.setDescription(product.getDescription());
        existing.setPrice(product.getPrice());
        existing.setImageUrl(product.getImageUrl());
        return productRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        checkAdminOrDevRole(role);
        if (!productRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found: " + id);
        }
        productRepository.deleteById(id);
    }
}
