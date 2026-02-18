# Personal Finance - Quick Start Guide

## First Time Setup

```bash
./deploy.sh
```

**Wait 5-10 minutes** for initial build and deployment.

## Access the Application

- **Web App**: http://localhost:3000
- **Admin Panel**: http://localhost:8080 (admin/admin)

## Daily Commands

| Command | Description |
|---------|-------------|
| `./start.sh` | Start all services |
| `./stop.sh` | Stop all services |
| `docker-compose ps` | Check status |
| `docker-compose logs -f` | View all logs |
| `docker-compose logs -f frontend` | View frontend logs |
| `docker-compose restart frontend` | Restart frontend |

## Troubleshooting

### Services won't start?
```bash
# Check Docker is running
docker info

# Check for port conflicts
lsof -i :3000  # Frontend
lsof -i :8080  # Keycloak
lsof -i :5432  # Database
```

### Need to reset everything?
```bash
docker-compose down -v
./deploy.sh
```

### View error logs?
```bash
docker-compose logs [service-name]
```

## Services

| Service | Port | Health Check |
|---------|------|--------------|
| Frontend | 3000 | http://localhost:3000 |
| User Service | 8081 | http://localhost:8081/q/health |
| Budget Service | 8082 | http://localhost:8082/q/health |
| Transaction Service | 8083 | http://localhost:8083/q/health |
| Keycloak | 8080 | http://localhost:8080/health |
| PostgreSQL | 5432 | (docker-compose ps) |

## API Documentation

- User Service: http://localhost:8081/swagger-ui
- Budget Service: http://localhost:8082/swagger-ui
- Transaction Service: http://localhost:8083/swagger-ui

---

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
