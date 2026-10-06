#!/usr/bin/env bash
set -e

# Map service DNS names to localhost so Spring Cloud Gateway routes resolve properly
# (http://product-service:8082, http://user-service:8081, etc.)
echo "127.0.0.1 product-service user-service cart-service order-service" >> /etc/hosts 2>/dev/null || true

echo "=========================================================="
echo "🚀 Initializing Shopping Cart Microservices on Unified Host"
echo "=========================================================="

# JVM optimization flags for 512MB RAM container constraint:
# - SerialGC: Lowest native memory overhead
# - Xss256k: Reduced thread stack size from 1024k to 256k
JVM_OPTS="-XX:+UseSerialGC -Xss256k"

# 1. Start User Service (Port 8081)
echo "Starting user-service on port 8081..."
SPRING_DATA_MONGODB_URI="${SPRING_DATA_MONGODB_URI_USER:-${SPRING_DATA_MONGODB_URI}}" \
java $JVM_OPTS -Xms30m -Xmx65m -jar user-service.jar &

# 2. Start Product Service (Port 8082)
echo "Starting product-service on port 8082..."
SPRING_DATA_MONGODB_URI="${SPRING_DATA_MONGODB_URI_PRODUCT:-${SPRING_DATA_MONGODB_URI}}" \
java $JVM_OPTS -Xms30m -Xmx65m -jar product-service.jar &

# 3. Start Cart Service (Port 8083)
echo "Starting cart-service on port 8083..."
SPRING_DATA_MONGODB_URI="${SPRING_DATA_MONGODB_URI_CART:-${SPRING_DATA_MONGODB_URI}}" \
java $JVM_OPTS -Xms30m -Xmx65m -jar cart-service.jar &

# 4. Start Order Service (Port 8084)
echo "Starting order-service on port 8084..."
SPRING_DATA_MONGODB_URI="${SPRING_DATA_MONGODB_URI_ORDER:-${SPRING_DATA_MONGODB_URI}}" \
java $JVM_OPTS -Xms30m -Xmx65m -jar order-service.jar &

# Brief pause for downstream services to initialize before gateway accepts traffic
sleep 5

# 5. Start API Gateway on Render's assigned port ($PORT or default 8080)
GATEWAY_PORT="${PORT:-8080}"
echo "Starting api-gateway on external port ${GATEWAY_PORT}..."
SERVER_PORT="${GATEWAY_PORT}" \
exec java $JVM_OPTS -Xms40m -Xmx85m -jar api-gateway.jar
