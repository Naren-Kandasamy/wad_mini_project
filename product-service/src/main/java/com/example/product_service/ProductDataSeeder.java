package com.example.product_service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ProductDataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public ProductDataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        seedCatalog();
    }

    public synchronized void seedCatalog() {
        if (productRepository.count() < 8) {
            System.out.println("🌱 Seeding comprehensive hardware catalog into MongoDB Atlas...");

            seedProductIfNotExists("Artisanal Tactile Keyboard",
                "Custom 75% mechanical keyboard with ceramic keycaps, brass plate, and tuned tactile switches.",
                149.99,
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3",
                "SKU-KB-001");

            seedProductIfNotExists("Nordic Split Ergo Keyboard",
                "Columnar split mechanical keyboard with anodized aluminum tenting case and hot-swap PCB.",
                189.00,
                "https://images.unsplash.com/photo-1595225476474-87563907a212",
                "SKU-KB-002");

            seedProductIfNotExists("Precision Ceramic Mouse",
                "Ergonomic wireless mouse with glazed ceramic coating and optical switches.",
                79.50,
                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7",
                "SKU-MS-001");

            seedProductIfNotExists("Graphite Wireless Trackball",
                "High-precision thumb trackball with dual Bluetooth/2.4GHz connectivity and ceramic bearings.",
                94.00,
                "https://images.unsplash.com/photo-1626218174358-7769486c4b79",
                "SKU-MS-002");

            seedProductIfNotExists("Monolith 27\" 4K Calibration Display",
                "27-inch 4K IPS display with 100% sRGB/DCI-P3 color accuracy, anti-glare matte coating, and minimalist milled aluminum stand.",
                449.00,
                "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf",
                "SKU-MON-001");

            seedProductIfNotExists("Ultrawide 34\" Curved Studio Monitor",
                "34-inch 144Hz curved ultrawide workstation display with integrated 90W USB-C power delivery.",
                599.00,
                "https://images.unsplash.com/photo-1585792180666-f7347c490ee2",
                "SKU-MON-002");

            seedProductIfNotExists("Studio Planar Magnetic Headphones",
                "Open-back reference headphones with hand-carved walnut earcups and planar magnetic drivers.",
                279.00,
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                "SKU-AUD-001");

            seedProductIfNotExists("Ceramic DAC & Balanced Headphone Amp",
                "Discrete audiophile USB DAC with balanced 4.4mm output and solid brass volume attenuator.",
                165.00,
                "https://images.unsplash.com/photo-1546435770-a3e426bf472b",
                "SKU-AUD-002");

            seedProductIfNotExists("Anodized Aluminum Desk Pad & Mat",
                "Chamfered aerospace-grade aluminum workstation mat with non-slip cork base.",
                45.00,
                "https://images.unsplash.com/photo-1616401784845-180882ba9ba8",
                "SKU-PER-001");

            seedProductIfNotExists("Custom Coiled Aviator Cable",
                "Double-sleeved paracord USB-C cable with quick-release 4-pin aviator connector.",
                32.00,
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
                "SKU-PER-002");

            System.out.println("✅ Catalog seeding complete! Total items: " + productRepository.count());
        }
    }

    private void seedProductIfNotExists(String name, String description, double price, String imageUrl, String sku) {
        Optional<Product> existingOpt = productRepository.findAll().stream()
            .filter(p -> p.getName() != null && p.getName().equalsIgnoreCase(name))
            .findFirst();
        if (existingOpt.isPresent()) {
            Product existing = existingOpt.get();
            if (existing.getSku() == null || existing.getSku().isBlank()) {
                existing.setSku(sku);
                productRepository.save(existing);
                System.out.println("  ~ Updated SKU for: " + name + " -> " + sku);
            }
        } else {
            productRepository.save(new Product(name, description, price, imageUrl, sku));
            System.out.println("  + Seeded: " + name);
        }
    }
}
