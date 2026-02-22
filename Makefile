.PHONY: network infra-up infra-stop infra-destroy services-up services-down services-restart service frontend-up frontend-down frontend-restart all-up all-down logs-infra logs-services logs-frontend

# Suppress orphan warnings across all targets — expected in a layered compose setup
export COMPOSE_IGNORE_ORPHANS=1

# ── Shared network ────────────────────────────────────────────────────────────
# All compose files declare the network as external, so it must pre-exist.
# This target creates it if missing; safe to call repeatedly.
network:
	docker network create personal-finance-net 2>/dev/null || true

# ── Infrastructure (postgres + keycloak) ──────────────────────────────────────
# Start once. Keep running across service/frontend redeployments.
infra-up: network
	docker compose -f docker-compose.infra.yml up -d

# Stop containers without deleting volumes (data is preserved)
infra-stop:
	docker compose -f docker-compose.infra.yml stop

# DANGER: removes containers AND the database volume — all data is lost
infra-destroy:
	@echo "⚠️  This will DELETE all database data. Press Ctrl-C to cancel, Enter to continue."
	@read _
	docker compose -f docker-compose.infra.yml down -v

# ── Backend services ──────────────────────────────────────────────────────────
services-up: network
	docker compose -f docker-compose.services.yml up -d --build

services-down:
	docker compose -f docker-compose.services.yml down

services-restart: services-down services-up

# Redeploy a single service: make service NAME=budget-service
service: network
	docker compose -f docker-compose.services.yml up -d --build $(NAME)

# ── Frontend ──────────────────────────────────────────────────────────────────
frontend-up: network
	docker compose -f docker-compose.frontend.yml up -d --build

frontend-down:
	docker compose -f docker-compose.frontend.yml down

frontend-restart: frontend-down frontend-up

# ── Full stack (first-time setup or full restart) ─────────────────────────────
all-up: network
	docker compose up -d --build

all-down:
	docker compose down

# ── Logs ──────────────────────────────────────────────────────────────────────
logs-infra:
	docker compose -f docker-compose.infra.yml logs -f

logs-services:
	docker compose -f docker-compose.services.yml logs -f

logs-frontend:
	docker compose -f docker-compose.frontend.yml logs -f
