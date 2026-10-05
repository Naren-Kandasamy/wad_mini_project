#!/usr/bin/env bash
# ==============================================================================
# Shopping Cart System - Stop Containers
# Stops and removes all project containers, freeing up all ports:
# 80, 8080, 8081, 8082, 8083, 8084, 27019.
# Note: Persistent database data stored in volume 'mongo-data' is preserved.
# ==============================================================================

set -e

# Change directory to project root
cd "$(dirname "$0")"

echo "🛑 Stopping and shutting down Shopping Cart microservices..."
docker compose down

echo ""
echo "=================================================================="
echo "✅ All project containers have been stopped and removed."
echo "   All ports (80, 8080, 8081, 8082, 8083, 8084, 27019) are now free!"
echo "   Database records in volume 'mongo-data' remain safely preserved."
echo "   Run './start.sh' whenever you want to restart the stack."
echo "=================================================================="
