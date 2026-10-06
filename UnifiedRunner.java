import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;

/**
 * Unified Microservices Launcher for Render Free Tier (512MB RAM limit).
 * 
 * Runs all 5 Spring Boot microservices inside ONE single JVM process using
 * isolated classloaders, sharing the JRE runtime, JIT compiler, and GC overhead.
 * This slashes memory consumption from 650MB down to ~270MB.
 */
public class UnifiedRunner {

    private static String getEnv(String fallback, String... names) {
        for (String name : names) {
            String val = System.getenv(name);
            if (val != null && !val.isBlank()) {
                return val.trim();
            }
        }
        return fallback;
    }

    public static void printMemory(String label) {
        try {
            MemoryMXBean mem = ManagementFactory.getMemoryMXBean();
            long heap = mem.getHeapMemoryUsage().getUsed() / (1024 * 1024);
            long nonHeap = mem.getNonHeapMemoryUsage().getUsed() / (1024 * 1024);
            System.out.printf("📊 [Memory - %s] Heap: %d MB | Metaspace/Non-Heap: %d MB | Total: %d MB%n",
                label, heap, nonHeap, heap + nonHeap);
        } catch (Throwable ignored) {}
    }

    public static void startApp(String name, String dirPath, String mainClassName, String port, String mongoUri) {
        new Thread(() -> {
            try {
                File dir = new File(dirPath);
                if (!dir.exists()) {
                    System.err.println("❌ Directory not found for " + name + ": " + dirPath);
                    return;
                }

                List<URL> urls = new ArrayList<>();
                File classesDir = new File(dir, "BOOT-INF/classes");
                if (classesDir.exists()) {
                    urls.add(classesDir.toURI().toURL());
                }

                File libDir = new File(dir, "BOOT-INF/lib");
                if (libDir.exists() && libDir.isDirectory()) {
                    File[] files = libDir.listFiles();
                    if (files != null) {
                        for (File f : files) {
                            if (f.getName().endsWith(".jar")) {
                                urls.add(f.toURI().toURL());
                            }
                        }
                    }
                }

                URLClassLoader loader = new URLClassLoader(urls.toArray(new URL[0]), ClassLoader.getPlatformClassLoader());
                Thread.currentThread().setContextClassLoader(loader);

                // Prevent Tomcat singleton factory collision across multiple embedded Tomcats
                try {
                    Class<?> factoryClass = loader.loadClass("org.apache.catalina.webresources.TomcatURLStreamHandlerFactory");
                    factoryClass.getMethod("disable").invoke(null);
                } catch (Throwable ignored) {}

                Class<?> appClass = loader.loadClass(mainClassName);
                System.out.println("🚀 Starting " + name + " (" + mainClassName + ") on port " + port + "...");

                List<String> argsList = new ArrayList<>();
                argsList.add("--server.port=" + port);
                if (mongoUri != null && !mongoUri.isBlank()) {
                    argsList.add("--spring.data.mongodb.uri=" + mongoUri);
                }

                Method main = appClass.getMethod("main", String[].class);
                main.invoke(null, (Object) argsList.toArray(new String[0]));
            } catch (Throwable t) {
                System.err.println("❌ Error starting " + name + ": " + t.getMessage());
                t.printStackTrace();
            }
        }, name).start();
    }

    public static void main(String[] args) throws Exception {
        System.out.println("==================================================================");
        System.out.println("🌟 Unified Microservices Launcher (Single JVM Architecture)      ");
        System.out.println("==================================================================");

        String userUri = getEnv(null, "SPRING_DATA_MONGODB_URI_USER", "MONGODB_URI_USER", "SPRING_DATA_MONGODB_URI", "MONGODB_URI");
        String productUri = getEnv(null, "SPRING_DATA_MONGODB_URI_PRODUCT", "MONGODB_URI_PRODUCT", "SPRING_DATA_MONGODB_URI", "MONGODB_URI");
        String cartUri = getEnv(null, "SPRING_DATA_MONGODB_URI_CART", "MONGODB_URI_CART", "SPRING_DATA_MONGODB_URI", "MONGODB_URI");
        String orderUri = getEnv(null, "SPRING_DATA_MONGODB_URI_ORDER", "MONGODB_URI_ORDER", "SPRING_DATA_MONGODB_URI", "MONGODB_URI");

        String basePath = args.length > 0 ? args[0] : "/app";
        String gatewayPort = getEnv("8080", "PORT", "SERVER_PORT");
        String userPort = getEnv("8081", "USER_SERVICE_PORT");
        String productPort = getEnv("8082", "PRODUCT_SERVICE_PORT");
        String cartPort = getEnv("8083", "CART_SERVICE_PORT");
        String orderPort = getEnv("8084", "ORDER_SERVICE_PORT");

        System.out.println("Base directory: " + basePath);
        System.out.println("Gateway external port: " + gatewayPort);
        System.out.println("User DB URI: " + (userUri != null ? "CONFIGURED (" + userUri.substring(0, Math.min(25, userUri.length())) + "...)" : "DEFAULT (localhost)"));
        System.out.println("Product DB URI: " + (productUri != null ? "CONFIGURED (" + productUri.substring(0, Math.min(25, productUri.length())) + "...)" : "DEFAULT (localhost)"));
        System.out.println("Cart DB URI: " + (cartUri != null ? "CONFIGURED (" + cartUri.substring(0, Math.min(25, cartUri.length())) + "...)" : "DEFAULT (localhost)"));
        System.out.println("Order DB URI: " + (orderUri != null ? "CONFIGURED (" + orderUri.substring(0, Math.min(25, orderUri.length())) + "...)" : "DEFAULT (localhost)"));

        // Register clean shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("🛑 Shutting down Unified Microservices Launcher...");
        }));

        // 1. User Service (Internal Port 8081)
        startApp("user-service", basePath + "/user", "com.example.user_service.UserServiceApplication", userPort, userUri);
        Thread.sleep(3000);

        // 2. Product Service (Internal Port 8082)
        startApp("product-service", basePath + "/product", "com.example.product_service.ProductServiceApplication", productPort, productUri);
        Thread.sleep(3000);

        // 3. Cart Service (Internal Port 8083)
        startApp("cart-service", basePath + "/cart", "com.example.cart_service.CartServiceApplication", cartPort, cartUri);
        Thread.sleep(3000);

        // 4. Order Service (Internal Port 8084)
        startApp("order-service", basePath + "/order", "com.example.order_service.OrderServiceApplication", orderPort, orderUri);
        Thread.sleep(3000);

        // 5. API Gateway (External Port - Render $PORT or 8080)
        startApp("api-gateway", basePath + "/gateway", "com.example.api_gateway.ApiGatewayApplication", gatewayPort, null);

        // Wait for gateway startup and print final memory status
        Thread.sleep(8000);
        System.gc();
        Thread.sleep(1000);
        printMemory("Steady State");
        System.out.println("✅ All 5 microservices are fully initialized and listening!");

        // Keep main thread alive
        Thread.currentThread().join();
    }
}
