#!/bin/bash

# Personal Finance Management System - Deployment Script
# This script builds and deploys all services using Docker Compose

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if Docker is running
check_docker() {
    print_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if docker-compose is available
check_docker_compose() {
    print_info "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Stop and remove existing containers
cleanup() {
    print_header "Cleaning Up Previous Deployment"

    print_info "Stopping all services..."
    docker-compose down || docker compose down || true

    print_info "Removing orphaned containers..."
    docker-compose down --remove-orphans || docker compose down --remove-orphans || true

    # Kill any lingering Quarkus dev mode processes
    print_info "Stopping local dev services..."
    pkill -f "quarkus.*dev" || true

    print_success "Cleanup complete"
}

# Build all services
build_services() {
    print_header "Building Services"

    print_info "Building backend services (this may take a few minutes)..."

    # Build user-service
    print_info "Building user-service..."
    cd services/user-service
    ./mvnw clean package -DskipTests
    cd ../..

    # Build budget-service
    print_info "Building budget-service..."
    cd services/budget-service
    ./mvnw clean package -DskipTests
    cd ../..

    # Build transaction-service
    print_info "Building transaction-service..."
    cd services/transaction-service
    ./mvnw clean package -DskipTests
    cd ../..

    print_success "All backend services built successfully"

    # Build Docker images
    print_info "Building Docker images..."
    docker-compose build || docker compose build

    print_success "All Docker images built successfully"
}

# Start all services
start_services() {
    print_header "Starting Services"

    print_info "Starting infrastructure (PostgreSQL, Keycloak)..."
    docker-compose up -d postgres keycloak || docker compose up -d postgres keycloak

    print_info "Waiting for PostgreSQL to be ready..."
    sleep 5

    print_info "Waiting for Keycloak to be ready (this may take 30-60 seconds)..."
    timeout=120
    elapsed=0
    while ! docker-compose exec -T keycloak curl -sf http://localhost:8080/health/ready > /dev/null 2>&1; do
        if [ $elapsed -ge $timeout ]; then
            print_error "Keycloak failed to start within ${timeout} seconds"
            docker-compose logs keycloak | tail -50
            exit 1
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done
    echo ""
    print_success "Keycloak is ready"

    # Run Keycloak setup
    print_info "Running Keycloak setup..."
    docker-compose up keycloak-setup || docker compose up keycloak-setup || true

    print_info "Starting backend services..."
    docker-compose up -d user-service budget-service transaction-service || docker compose up -d user-service budget-service transaction-service

    print_info "Waiting for backend services to be ready..."
    sleep 10

    print_info "Starting frontend..."
    docker-compose up -d frontend || docker compose up -d frontend

    print_success "All services started"
}

# Check service health
check_health() {
    print_header "Health Check"

    services=(
        "PostgreSQL|http://localhost:5432|5432"
        "Keycloak|http://localhost:8080|8080"
        "User Service|http://localhost:8081/q/health|8081"
        "Budget Service|http://localhost:8082/q/health|8082"
        "Transaction Service|http://localhost:8083/q/health|8083"
        "Frontend|http://localhost:3000|3000"
    )

    for service_info in "${services[@]}"; do
        IFS='|' read -r name url port <<< "$service_info"

        if [ "$name" == "PostgreSQL" ]; then
            if docker-compose ps postgres | grep -q "Up"; then
                print_success "$name is running on port $port"
            else
                print_warning "$name may not be running properly"
            fi
        elif curl -sf "$url" > /dev/null 2>&1; then
            print_success "$name is healthy at $url"
        else
            print_warning "$name at $url is not responding yet (may need more time)"
        fi
    done
}

# Print access information
print_access_info() {
    print_header "Deployment Complete!"

    echo ""
    echo -e "${GREEN}✓${NC} All services are deployed and running"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  • Frontend:            ${GREEN}http://localhost:3000${NC}"
    echo -e "  • Keycloak Admin:      ${GREEN}http://localhost:8080${NC}"
    echo -e "    - Username:          admin"
    echo -e "    - Password:          admin"
    echo ""
    echo -e "${BLUE}API Documentation (Swagger):${NC}"
    echo -e "  • User Service:        ${GREEN}http://localhost:8081/swagger-ui${NC}"
    echo -e "  • Budget Service:      ${GREEN}http://localhost:8082/swagger-ui${NC}"
    echo -e "  • Transaction Service: ${GREEN}http://localhost:8083/swagger-ui${NC}"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  • View logs:           docker-compose logs -f [service-name]"
    echo -e "  • Stop all services:   docker-compose down"
    echo -e "  • Restart a service:   docker-compose restart [service-name]"
    echo -e "  • View running:        docker-compose ps"
    echo ""
}

# Main deployment flow
main() {
    print_header "Personal Finance Deployment"

    # Check prerequisites
    check_docker
    check_docker_compose

    # Ask for confirmation
    echo ""
    read -p "This will rebuild and restart all services. Continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi

    # Execute deployment steps
    cleanup
    build_services
    start_services

    # Give services time to stabilize
    print_info "Waiting for services to stabilize..."
    sleep 15

    check_health
    print_access_info

    print_success "Deployment script completed successfully!"
}

# Run main function
main
