#!/usr/bin/env bash
# ==============================================================================
# Shopping Cart System - Run Automated E2E Test Suite (Linux/macOS)
# ==============================================================================

set -e
cd "$(dirname "$0")"

echo "🧪 Running End-to-End (E2E) Integration and Security Test Suite..."
node e2e_test.js
