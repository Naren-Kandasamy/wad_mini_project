package com.example.product_service;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
public class Product {
    @Id
    private String id;
    private String name;
    private String description;
    private double price;
    private String imageUrl;
    private String sku;

    public Product() {}
    public Product(String name, String description, double price, String imageUrl) {
        this.name = name; this.description = description; this.price = price; this.imageUrl = imageUrl;
    }
    public Product(String name, String description, double price, String imageUrl, String sku) {
        this.name = name; this.description = description; this.price = price; this.imageUrl = imageUrl; this.sku = sku;
    }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
}
