#!/bin/bash
# Personal Finance - Deployment Script
#
# Usage:
#   ./deploy.sh              # Deploy everything (prompts before touching infra)
#   ./deploy.sh infra        # (Re)deploy infrastructure only
#   ./deploy.sh services     # Rebuild and redeploy backend services only
#   ./deploy.sh frontend     # Rebuild and redeploy frontend only
#   ./deploy.sh apps         # Rebuild and redeploy services + frontend (skips infra)

set -e

# Suppress "orphan containers" warnings that appear when multiple compose
# files share the same project name — expected in a layered setup.
export COMPOSE_IGNORE_ORPHANS=1

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
header()  { echo -e "\n${CYAN}── $1 ──${NC}\n"; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
check_prereqs() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker Desktop and retry."
        exit 1
    fi
    if ! docker compose version > /dev/null 2>&1; then
        error "Docker Compose plugin not found. Please update Docker Desktop."
        exit 1
    fi
    success "Docker is running"
}

# ── Helpers ───────────────────────────────────────────────────────────────────
infra_running() {
    docker ps --filter "status=running" --format "{{.Names}}" | grep -q "personal-finance[_-]postgres"
}

# Ensure the shared network exists and that any already-running infra
# containers (started by the old compose setup) are connected to it.
ensure_network() {
    local network="personal-finance-net"

    # Create the network if it doesn't exist.
    # All compose files declare it as external so none of them own it —
    # this avoids Docker Compose label conflicts entirely.
    if ! docker network inspect "$network" > /dev/null 2>&1; then
        info "Creating shared network $network..."
        docker network create "$network"
    fi

    # Connect infra containers with service-name aliases so that 'postgres'
    # and 'keycloak' hostnames resolve inside the services/frontend containers.
    # Handles both old (underscore) and new (dash) container naming conventions.
    _connect_with_alias() {
        local alias="$1" pattern="$2"
        local container
        container=$(docker ps --format "{{.Names}}" | grep "personal-finance" | grep "$pattern" | head -1)
        [ -z "$container" ] && return

        # Check if already connected with the alias
        local has_alias
        has_alias=$(docker inspect "$container" \
            --format "{{range .NetworkSettings.Networks}}{{range .Aliases}}{{.}} {{end}}{{end}}" 2>/dev/null)
        if echo "$has_alias" | grep -qw "$alias"; then
            return  # already connected with correct alias
        fi

        # Disconnect first if on the network without alias, then reconnect
        if docker network inspect "$network" --format '{{range .Containers}}{{.Name}} {{end}}' \
                2>/dev/null | grep -q "$container"; then
            info "Re-connecting $container to $network with alias '$alias'..."
            docker network disconnect "$network" "$container" 2>/dev/null || true
        else
            info "Connecting $container to $network with alias '$alias'..."
        fi
        docker network connect --alias "$alias" "$network" "$container"
    }

    _connect_with_alias "postgres" "postgres"
    _connect_with_alias "keycloak" "keycloak"
}

wait_for_keycloak() {
    info "Waiting for Keycloak to be ready (up to 3 min)..."
    local timeout=180 elapsed=0
    until curl -sf http://localhost:8080/realms/master > /dev/null 2>&1; do
        if [ "$elapsed" -ge "$timeout" ]; then
            error "Keycloak did not start within ${timeout}s. Check logs: docker compose -f docker-compose.infra.yml logs keycloak"
            exit 1
        fi
        sleep 5; elapsed=$((elapsed + 5)); printf "."
    done
    echo ""
    success "Keycloak is ready"
}

print_urls() {
    header "Deployment Complete"
    echo -e "  Application   ${GREEN}http://localhost:3000${NC}"
    echo -e "  Keycloak      ${GREEN}http://localhost:8080${NC}  (admin / ${KEYCLOAK_ADMIN_PASSWORD:-admin123})"
    echo ""
    echo -e "  Swagger UI:"
    echo -e "    user-service        http://localhost:8081/swagger-ui"
    echo -e "    budget-service      http://localhost:8082/swagger-ui"
    echo -e "    transaction-service http://localhost:8083/swagger-ui"
    echo ""
    echo -e "  Health checks:"
    echo -e "    curl http://localhost:8081/q/health"
    echo -e "    curl http://localhost:8082/q/health"
    echo -e "    curl http://localhost:8083/q/health"
    echo ""
    echo -e "  Useful Makefile targets:"
    echo -e "    make services-up     # redeploy backend only"
    echo -e "    make frontend-up     # redeploy frontend only"
    echo -e "    make logs-services   # tail backend logs"
    echo ""
}

# ── Deployment functions ──────────────────────────────────────────────────────
deploy_infra() {
    header "Infrastructure (PostgreSQL + Keycloak)"
    ensure_network
    docker compose -f docker-compose.infra.yml up -d
    wait_for_keycloak
    success "Infrastructure deployed"
}

deploy_services() {
    header "Backend Services"
    ensure_network
    docker compose -f docker-compose.services.yml up -d --build
    info "Waiting for services to initialise..."
    sleep 8
    success "Backend services deployed"
}

deploy_frontend() {
    header "Frontend"
    ensure_network
    docker compose -f docker-compose.frontend.yml up -d --build
    success "Frontend deployed"
}

# ── Health check ─────────────────────────────────────────────────────────────
check_health() {
    header "Health Check"
    local endpoints=(
        "user-service|http://localhost:8081/q/health"
        "budget-service|http://localhost:8082/q/health"
        "transaction-service|http://localhost:8083/q/health"
        "frontend|http://localhost:3000"
    )
    for entry in "${endpoints[@]}"; do
        IFS='|' read -r name url <<< "$entry"
        if curl -sf "$url" > /dev/null 2>&1; then
            success "$name"
        else
            warn "$name not responding yet (may still be starting)"
        fi
    done
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
    local layer="${1:-all}"

    header "Personal Finance — Deploy: ${layer}"
    check_prereqs

    case "$layer" in
        infra)
            deploy_infra
            ;;
        services)
            if ! infra_running; then
                error "Infrastructure is not running. Start it first: make infra-up"
                exit 1
            fi
            deploy_services
            check_health
            ;;
        frontend)
            if ! infra_running; then
                error "Infrastructure is not running. Start it first: make infra-up"
                exit 1
            fi
            deploy_frontend
            ;;
        apps)
            if ! infra_running; then
                error "Infrastructure is not running. Start it first: make infra-up"
                exit 1
            fi
            deploy_services
            deploy_frontend
            check_health
            ;;
        all)
            echo ""
            if infra_running; then
                warn "Infrastructure is already running."
                warn "This will STOP and recreate postgres + keycloak (data is preserved)."
            fi
            read -rp "Deploy everything? (y/N) " confirm
            [[ "$confirm" =~ ^[Yy]$ ]] || { info "Cancelled."; exit 0; }

            deploy_infra
            deploy_services
            deploy_frontend
            check_health
            print_urls
            ;;
        *)
            error "Unknown layer: $layer"
            echo "Usage: ./deploy.sh [all|infra|services|frontend|apps]"
            exit 1
            ;;
    esac

    success "Done."
}

main "$@"
