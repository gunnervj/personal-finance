# Personal Finance Management System - Deployment Guide

## Prerequisites

Before deploying, ensure you have the following installed:

- **Docker Desktop** (version 20.10 or higher)
  - Download from: https://www.docker.com/products/docker-desktop
- **Docker Compose** (usually included with Docker Desktop)
- **Java 21** (for local development only)
- **Node.js 18+** (for local development only)

## Configuration

### Environment Variables

The application uses a `.env` file for configuration. A `.env.example` template is provided.

1. **Create your .env file** (first time only)
   ```bash
   cp .env.example .env
   ```

2. **Edit .env** for your environment
   ```bash
   # For localhost deployment (default)
   APP_DOMAIN=localhost

   # For remote server deployment (example)
   APP_DOMAIN=your-server-hostname
   # or
   APP_DOMAIN=192.168.1.100
   ```

**Important Configuration Options:**

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_DOMAIN` | `localhost` | Hostname/IP where the app is accessible |
| `FRONTEND_PORT` | `3000` | Port for the frontend application |
| `KEYCLOAK_PORT` | `8080` | Port for Keycloak authentication |
| `POSTGRES_USER` | `admin` | Database username |
| `POSTGRES_PASSWORD` | `admin` | Database password (change in production!) |
| `NEXTAUTH_SECRET` | (example) | Secret for NextAuth (MUST change in production) |

**After changing .env**, restart the services:
```bash
docker-compose down
./deploy.sh
```

## Quick Start (First Time Deployment)

1. **Clone the repository** (if not already done)
   ```bash
   cd /path/to/personal-finance
   ```

2. **Configure environment** (first time only)
   ```bash
   cp .env.example .env
   # Edit .env if deploying to a remote server
   nano .env  # or use your preferred editor
   ```

3. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

   This script will:
   - Stop any running services
   - Build all backend services (User, Budget, Transaction)
   - Build all Docker images
   - Start PostgreSQL and Keycloak
   - Run Keycloak setup to create realm and clients
   - Start all backend services
   - Start the frontend
   - Perform health checks

   **Note:** First deployment takes 5-10 minutes due to Maven dependencies and Docker image builds.

3. **Access the application**

   Once deployment completes, you can access:
   - **Application**: http://localhost:3000
   - **Keycloak Admin**: http://localhost:8080 (admin/admin)
   - **API Documentation**:
     - User Service: http://localhost:8081/swagger-ui
     - Budget Service: http://localhost:8082/swagger-ui
     - Transaction Service: http://localhost:8083/swagger-ui

## Daily Usage

After the initial deployment, use these simpler scripts:

### Start Services
```bash
./start.sh
```

### Stop Services
```bash
./stop.sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f user-service
docker-compose logs -f budget-service
docker-compose logs -f transaction-service
docker-compose logs -f keycloak
docker-compose logs -f postgres
```

### Check Status
```bash
docker-compose ps
```

### Restart a Service
```bash
docker-compose restart [service-name]

# Examples:
docker-compose restart frontend
docker-compose restart user-service
```

## Complete Teardown

To completely remove all containers, networks, and volumes:

```bash
docker-compose down -v
```

**Warning:** This will delete all data including the database!

## Troubleshooting

### Services Won't Start

1. **Check Docker is running**
   ```bash
   docker info
   ```

2. **Check for port conflicts**
   ```bash
   # Check if ports are already in use
   lsof -i :3000  # Frontend
   lsof -i :8080  # Keycloak
   lsof -i :8081  # User Service
   lsof -i :8082  # Budget Service
   lsof -i :8083  # Transaction Service
   lsof -i :5432  # PostgreSQL
   ```

3. **View error logs**
   ```bash
   docker-compose logs [service-name]
   ```

### Database Issues

1. **Reset the database**
   ```bash
   docker-compose down -v
   ./deploy.sh
   ```

### Keycloak Issues

1. **Check if Keycloak is ready**
   ```bash
   docker-compose exec keycloak curl http://localhost:8080/health/ready
   ```

2. **Rerun Keycloak setup**
   ```bash
   docker-compose up keycloak-setup
   ```

### Frontend Not Loading

1. **Check backend services are healthy**
   ```bash
   curl http://localhost:8081/q/health
   curl http://localhost:8082/q/health
   curl http://localhost:8083/q/health
   ```

2. **Rebuild frontend**
   ```bash
   docker-compose build frontend
   docker-compose restart frontend
   ```

### Clear All Data and Start Fresh

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Redeploy
./deploy.sh
```

## Architecture

### Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database for all services |
| Keycloak | 8080 | Authentication and authorization |
| User Service | 8081 | User preferences and avatars |
| Budget Service | 8082 | Budget management |
| Transaction Service | 8083 | Transaction management |
| Frontend | 3000 | Next.js web application |

### Data Persistence

- **Database data**: Stored in Docker volume `pgdata`
- **User avatars**: Stored in `./data/avatars`

### Network

All services run on the default Docker Compose network and can communicate using service names (e.g., `http://user-service:8081`).

## Environment Variables

### Production Deployment

For production, update these values in `docker-compose.yml`:

1. **Database credentials** (postgres service)
   - `POSTGRES_PASSWORD`
   - `POSTGRES_USER`

2. **Keycloak admin** (keycloak service)
   - `KEYCLOAK_ADMIN_PASSWORD`

3. **NextAuth secret** (frontend service)
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`

4. **Service secrets** (all backend services)
   - `KEYCLOAK_SECRET`
   - Update in Keycloak admin console after deployment

5. **Public URLs** (frontend service)
   - Update all `localhost` references to your domain

## Development Mode

### Running Services Locally (Outside Docker)

For development, you can run services locally:

1. **Start infrastructure only**
   ```bash
   docker-compose up -d postgres keycloak keycloak-setup
   ```

2. **Run backend services**
   ```bash
   # Terminal 1 - User Service
   cd services/user-service
   ./mvnw quarkus:dev

   # Terminal 2 - Budget Service
   cd services/budget-service
   ./mvnw quarkus:dev

   # Terminal 3 - Transaction Service
   cd services/transaction-service
   ./mvnw quarkus:dev
   ```

3. **Run frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The services are configured to use `localhost` in dev mode and container hostnames in production.

## Monitoring

### Health Endpoints

- User Service: http://localhost:8081/q/health
- Budget Service: http://localhost:8082/q/health
- Transaction Service: http://localhost:8083/q/health
- Keycloak: http://localhost:8080/health

### Metrics

Quarkus services expose Prometheus-compatible metrics at:
- http://localhost:8081/q/metrics
- http://localhost:8082/q/metrics
- http://localhost:8083/q/metrics

## Support

For issues or questions:
1. Check the logs: `docker-compose logs [service]`
2. Check health endpoints
3. Review this troubleshooting guide
4. Check the CLAUDE.md file for project-specific requirements
