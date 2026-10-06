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

# Runtime stage: minimal Alpine JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache bash curl

# Copy compiled JARs
COPY --from=build /build/user-service/target/*.jar user-service.jar
COPY --from=build /build/product-service/target/*.jar product-service.jar
COPY --from=build /build/cart-service/target/*.jar cart-service.jar
COPY --from=build /build/order-service/target/*.jar order-service.jar
COPY --from=build /build/api-gateway/target/*.jar api-gateway.jar

# Copy entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/bin/bash", "./entrypoint.sh"]
