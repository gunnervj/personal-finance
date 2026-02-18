#!/bin/bash

# Stop script for Personal Finance Management System

echo "🛑 Stopping Personal Finance Management System..."

docker-compose stop || docker compose stop

echo "✅ All services stopped"
echo ""
echo "To start again: ./start.sh"
echo "To fully remove: docker-compose down"
