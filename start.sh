#!/usr/bin/env bash
# ==============================================================================
# Shopping Cart System - Start Containers
# Starts all 7 microservices in detached mode and displays running statuses.
# ==============================================================================

set -e

# Change directory to project root
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found."
  echo "   Creating .env from .env.example template..."
  cp .env.example .env
  echo "   Please populate your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
fi

echo "🚀 Starting Shopping Cart microservices stack..."
docker compose up -d --build

echo ""
echo "⏳ Waiting for services to initialize..."
sleep 4

echo ""
echo "=================================================================="
echo "                CONTAINER STATUS & ACTIVE PORTS                   "
echo "=================================================================="
docker compose ps

echo ""
echo "🌐 Service Endpoints:"
echo "   - Frontend UI:    http://localhost:80"
echo "   - API Gateway:    http://localhost:8080"
echo "   - Auth Status:    http://localhost:8080/api/me"
echo "   - User Service:   http://localhost:8081"
echo "   - Product Service:http://localhost:8082"
echo "   - Cart Service:   http://localhost:8083"
echo "   - Order Service:  http://localhost:8084"
echo "   - MongoDB:        localhost:27019"
echo "=================================================================="
echo "✅ All containers started successfully!"
echo "   Run './stop.sh' anytime to stop all containers and release ports."
