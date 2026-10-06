#!/usr/bin/env bash
set -e

# Map service DNS names to localhost so Spring Cloud Gateway routes resolve properly
# (http://product-service:8082, http://user-service:8081, etc.)
echo "127.0.0.1 product-service user-service cart-service order-service" >> /etc/hosts 2>/dev/null || true

echo "=========================================================="
echo "🚀 Initializing Shopping Cart Microservices on Unified Host"
echo "=========================================================="

# JVM optimization flags for Render 512MB RAM & 0.5 CPU limits:
# 1. TieredStopAtLevel=1: Disables heavy C2 JIT compiler -> 60% memory savings & 4x faster startup
# 2. UseSerialGC: Minimal garbage collector native memory footprint
# 3. Xss256k: Reduces thread stack from 1MB to 256KB
# 4. MaxMetaspaceSize=45m: Restricts metaspace ceiling per JVM
JVM_OPTS="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xss256k -XX:MaxMetaspaceSize=45m"

# Resolve Mongo URIs flexibly from multiple possible env variable names
USER_URI="${SPRING_DATA_MONGODB_URI_USER:-${SPRING_MONGODB_URI_USER:-${SPRING_DATA_MONGODB_URI:-${SPRING_MONGODB_URI}}}}"
PRODUCT_URI="${SPRING_DATA_MONGODB_URI_PRODUCT:-${SPRING_MONGODB_URI_PRODUCT:-${SPRING_DATA_MONGODB_URI:-${SPRING_MONGODB_URI}}}}"
CART_URI="${SPRING_DATA_MONGODB_URI_CART:-${SPRING_MONGODB_URI_CART:-${SPRING_DATA_MONGODB_URI:-${SPRING_MONGODB_URI}}}}"
ORDER_URI="${SPRING_DATA_MONGODB_URI_ORDER:-${SPRING_MONGODB_URI_ORDER:-${SPRING_DATA_MONGODB_URI:-${SPRING_MONGODB_URI}}}}"

echo "Mongo URI status:"
echo "  - user-service: $([ -n "$USER_URI" ] && echo "CONFIGURED (${USER_URI:0:22}...)" || echo "MISSING - fallback to default")"
echo "  - product-service: $([ -n "$PRODUCT_URI" ] && echo "CONFIGURED (${PRODUCT_URI:0:22}...)" || echo "MISSING - fallback to default")"
echo "  - cart-service: $([ -n "$CART_URI" ] && echo "CONFIGURED (${CART_URI:0:22}...)" || echo "MISSING - fallback to default")"
echo "  - order-service: $([ -n "$ORDER_URI" ] && echo "CONFIGURED (${ORDER_URI:0:22}...)" || echo "MISSING - fallback to default")"

# 1. Start User Service (Port 8081)
echo "Starting user-service on port 8081..."
SPRING_DATA_MONGODB_URI="$USER_URI" \
java $JVM_OPTS -Xms15m -Xmx35m \
  -Dspring.data.mongodb.uri="$USER_URI" \
  -Dspring.mongodb.uri="$USER_URI" \
  -jar user-service.jar &
sleep 2

# 2. Start Product Service (Port 8082)
echo "Starting product-service on port 8082..."
SPRING_DATA_MONGODB_URI="$PRODUCT_URI" \
java $JVM_OPTS -Xms15m -Xmx35m \
  -Dspring.data.mongodb.uri="$PRODUCT_URI" \
  -Dspring.mongodb.uri="$PRODUCT_URI" \
  -jar product-service.jar &
sleep 2

# 3. Start Cart Service (Port 8083)
echo "Starting cart-service on port 8083..."
SPRING_DATA_MONGODB_URI="$CART_URI" \
java $JVM_OPTS -Xms15m -Xmx35m \
  -Dspring.data.mongodb.uri="$CART_URI" \
  -Dspring.mongodb.uri="$CART_URI" \
  -jar cart-service.jar &
sleep 2

# 4. Start Order Service (Port 8084)
echo "Starting order-service on port 8084..."
SPRING_DATA_MONGODB_URI="$ORDER_URI" \
java $JVM_OPTS -Xms15m -Xmx35m \
  -Dspring.data.mongodb.uri="$ORDER_URI" \
  -Dspring.mongodb.uri="$ORDER_URI" \
  -jar order-service.jar &
sleep 2

# 5. Start API Gateway on Render's assigned port ($PORT or default 8080)
GATEWAY_PORT="${PORT:-8080}"
echo "Starting api-gateway on external port ${GATEWAY_PORT}..."
SERVER_PORT="${GATEWAY_PORT}" \
exec java $JVM_OPTS -Xms20m -Xmx50m \
  -Dserver.port="${GATEWAY_PORT}" \
  -jar api-gateway.jar
