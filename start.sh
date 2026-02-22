#!/bin/bash
# Start all layers without rebuilding.
# Use this after a machine restart to bring everything back up.
# To rebuild images use deploy.sh or the Makefile instead.

set -e

GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} Docker is not running."
    exit 1
fi

echo -e "${BLUE}Starting Personal Finance...${NC}"

docker compose -f docker-compose.infra.yml    start 2>/dev/null || \
    docker compose -f docker-compose.infra.yml up -d

docker compose -f docker-compose.services.yml start 2>/dev/null || \
    docker compose -f docker-compose.services.yml up -d

docker compose -f docker-compose.frontend.yml start 2>/dev/null || \
    docker compose -f docker-compose.frontend.yml up -d

echo -e "${GREEN}All services started.${NC}"
echo ""
echo "  Application  http://localhost:3000"
echo "  Keycloak     http://localhost:8080"
echo ""
echo "Logs: make logs-services  |  make logs-frontend  |  make logs-infra"
