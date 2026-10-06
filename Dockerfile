# Multi-stage build: compile all 5 microservices
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# 1. User Service
COPY user-service/pom.xml user-service/
COPY user-service/src user-service/src/
RUN cd user-service && mvn clean package -DskipTests

# 2. Product Service
COPY product-service/pom.xml product-service/
COPY product-service/src product-service/src/
RUN cd product-service && mvn clean package -DskipTests

# 3. Cart Service
COPY cart-service/pom.xml cart-service/
COPY cart-service/src cart-service/src/
RUN cd cart-service && mvn clean package -DskipTests

# 4. Order Service
COPY order-service/pom.xml order-service/
COPY order-service/src order-service/src/
RUN cd order-service && mvn clean package -DskipTests

# 5. API Gateway
COPY api-gateway/pom.xml api-gateway/
COPY api-gateway/src api-gateway/src/
RUN cd api-gateway && mvn clean package -DskipTests

# 6. Unpack JARs into dedicated directories for the single-JVM classloader launcher
RUN mkdir -p /app/user && cd /app/user && jar -xf /build/user-service/target/*.jar && \
    mkdir -p /app/product && cd /app/product && jar -xf /build/product-service/target/*.jar && \
    mkdir -p /app/cart && cd /app/cart && jar -xf /build/cart-service/target/*.jar && \
    mkdir -p /app/order && cd /app/order && jar -xf /build/order-service/target/*.jar && \
    mkdir -p /app/gateway && cd /app/gateway && jar -xf /build/api-gateway/target/*.jar

# 7. Compile UnifiedRunner
COPY UnifiedRunner.java /build/
RUN javac /build/UnifiedRunner.java -d /app/

# Runtime stage: Standard Debian-based Temurin JRE (glibc with reliable DNS SRV resolution)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy all unpacked applications and compiled UnifiedRunner
COPY --from=build /app /app

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
