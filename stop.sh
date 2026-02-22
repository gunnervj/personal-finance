#!/bin/bash
# Stop all layers without removing containers or volumes.
# Data is fully preserved. Use start.sh to resume.

set -e

YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

echo -e "${YELLOW}Stopping Personal Finance...${NC}"

docker compose -f docker-compose.frontend.yml stop 2>/dev/null || true
docker compose -f docker-compose.services.yml  stop 2>/dev/null || true
docker compose -f docker-compose.infra.yml     stop 2>/dev/null || true

echo -e "${GREEN}All services stopped. Data is preserved.${NC}"
echo ""
echo "To start again:   ./start.sh"
echo "To redeploy:      ./deploy.sh [all|infra|services|frontend|apps]"
