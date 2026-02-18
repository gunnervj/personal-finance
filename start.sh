#!/bin/bash

# Quick start script for Personal Finance Management System
# Use this after initial deployment to start all services

set -e

echo "🚀 Starting Personal Finance Management System..."

# Check if containers exist
if ! docker-compose ps | grep -q "personal-finance"; then
    echo "⚠️  Services not deployed yet. Please run ./deploy.sh first"
    exit 1
fi

# Start all services
docker-compose start || docker compose start

echo "✅ All services started"
echo ""
echo "Access the application at: http://localhost:3000"
echo "Keycloak Admin: http://localhost:8080 (admin/admin)"
echo ""
echo "To view logs: docker-compose logs -f"
