#!/usr/bin/env bash
set -e

# Map service DNS hostnames to 127.0.0.1 for internal loopback routing
echo "127.0.0.1 product-service user-service cart-service order-service" >> /etc/hosts 2>/dev/null || true

echo "=========================================================="
echo "🚀 Initializing Shopping Cart Microservices on Unified JVM"
echo "=========================================================="

# JVM optimization flags for Render 512MB RAM limit:
# 1. TieredStopAtLevel=1: C1 compiler only -> 60% memory savings & 4x faster startup
# 2. UseSerialGC: Minimal garbage collector native memory footprint
# 3. Xss256k: Reduces thread stack from 1MB to 256KB
# 4. Xms30m -Xmx180m: Heap capped safely at 180MB (typical steady state: ~75MB)
# 5. MaxMetaspaceSize=240m: Sufficient ceiling for class metadata across 5 services
JVM_OPTS="-XX:TieredStopAtLevel=1 -XX:+UseSerialGC -Xss256k -Xms30m -Xmx180m -XX:MaxMetaspaceSize=240m"

exec java $JVM_OPTS -cp /app UnifiedRunner /app
