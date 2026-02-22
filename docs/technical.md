# Technical Reference

Developer documentation covering architecture, local setup, database schema, authentication, and deployment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS, NextAuth.js 4 |
| Backend | Quarkus 3 (Java), RESTful JSON APIs, Liquibase migrations |
| Auth | Keycloak 24 — OIDC / Authorization Code flow |
| Database | PostgreSQL 16 — three isolated schemas |
| Runtime | Docker Compose (all environments) |

---

## Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| user-service | 8081 | User preferences, avatar management |
| budget-service | 8082 | Expense types, budgets, budget items |
| transaction-service | 8083 | Transactions, aggregations, summaries |
| Keycloak | 8080 | Authentication, JWT issuance |
| Frontend | 3000 | Next.js UI |

Each service owns its own database schema and validates JWTs independently using Keycloak's public keys (no network call per request).

---

## Local Development Setup

### Prerequisites

- Docker Desktop (includes Compose plugin)
- Node.js 22+ (frontend only, for local dev outside Docker)
- Java 21 + Maven (services only, for local dev outside Docker)

### First-time deployment

```bash
# Copy environment file
cp .env.example .env   # edit if needed — defaults work for local

# Deploy everything
./deploy.sh

# Or layer by layer:
make infra-up          # start postgres + keycloak (once)
make services-up       # build + start backend services
make frontend-up       # build + start frontend
```

### Day-to-day commands

```bash
./start.sh             # resume all after machine restart (no rebuild)
./stop.sh              # pause all (data preserved)

./deploy.sh services   # rebuild + redeploy backend only
./deploy.sh frontend   # rebuild + redeploy frontend only
./deploy.sh apps       # rebuild + redeploy services + frontend

make service NAME=budget-service   # rebuild a single service
make logs-services                 # tail backend logs
make logs-frontend                 # tail frontend logs
```

### Accessing services

| Service | URL |
|---------|-----|
| Application | http://localhost:3000 |
| Keycloak admin | http://localhost:8080 (admin / admin123) |
| user-service Swagger | http://localhost:8081/swagger-ui |
| budget-service Swagger | http://localhost:8082/swagger-ui |
| transaction-service Swagger | http://localhost:8083/swagger-ui |
| user-service health | http://localhost:8081/q/health |
| budget-service health | http://localhost:8082/q/health |
| transaction-service health | http://localhost:8083/q/health |

### Database access

```bash
PGPASSWORD=admin1 psql -h localhost -U admin -d personalfinance
```

---

## Compose File Structure

| File | Purpose |
|------|---------|
| `docker-compose.infra.yml` | PostgreSQL + Keycloak — start once, keep running |
| `docker-compose.services.yml` | Backend microservices — safe to rebuild independently |
| `docker-compose.frontend.yml` | Next.js frontend — safe to rebuild independently |
| `docker-compose.yml` | Full-stack convenience file — starts everything at once |

All files share the named Docker network `personal-finance-net`. The `pgdata` volume is declared only in the infra file — running services or frontend deploys can never affect it.

> **Never run `docker compose -f docker-compose.infra.yml down -v`** — the `-v` flag deletes the database volume.

---

## Database Schema

### user_schema

**user_preferences**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| email | VARCHAR(255) | Unique — user identifier |
| preferences | JSONB | `{ currency, monthlySalary, emergencyFundMonths, emergencyFundSaved }` |
| avatar_path | VARCHAR(500) | Optional |
| created_at / updated_at | TIMESTAMP | |

### budget_schema

**expense_types**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_email | VARCHAR(255) | |
| name | VARCHAR(100) | Unique per user |
| icon | VARCHAR(50) | Lucide icon name |
| is_mandatory | BOOLEAN | Used for emergency fund calc |
| accumulate | BOOLEAN | Carry unspent forward each month |

**budgets**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_email | VARCHAR(255) | |
| year | INTEGER | One budget per user per year |

**budget_items**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| budget_id | UUID | FK → budgets (CASCADE) |
| expense_type_id | UUID | FK → expense_types (RESTRICT) |
| amount | DECIMAL(12,2) | Monthly budget amount |
| is_one_time | BOOLEAN | |
| applicable_month | INTEGER | 1–12 for one-time items |

### transaction_schema

**transactions**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_email | VARCHAR(255) | |
| budget_item_id | UUID | Links to budget item |
| expense_type_id | UUID | Denormalised for query efficiency |
| amount | DECIMAL(12,2) | |
| description | VARCHAR(500) | Optional |
| transaction_date | DATE | |

---

## Authentication

### Keycloak setup

- **Realm**: `personal-finance`
- **Frontend client**: public, authorization code + PKCE
- **Service clients**: confidential (user-service, budget-service, transaction-service)
- Email used as username; email claim included in JWT
- Auto-configured on first start via `infrastructure/keycloak/setup-keycloak.sh` (idempotent)

### NextAuth.js (frontend)

- Strategy: JWT (stateless)
- Login page: `/login`
- Protected routes: `/dashboard`, `/budgets`, `/transactions`
- Internal (Docker) and external (browser) Keycloak URLs are kept separate to avoid DNS resolution issues inside Docker:
  - `KEYCLOAK_ISSUER` — external localhost URL, used for JWT `iss` claim validation
  - `KEYCLOAK_INTERNAL_ISSUER` — internal `keycloak:8080` URL, used for server-side OIDC discovery and token exchange

### Token lifespans (configure in Keycloak admin)

| Setting | Recommended |
|---------|-------------|
| Access Token Lifespan | 5–15 min |
| SSO Session Idle | 30 min |
| SSO Session Max | 10 h |

---

## Adding Database Migrations

1. Create changeset file in the relevant service:
   ```
   services/budget-service/src/main/resources/db/changelog/006-my-change.xml
   ```
2. Register it in the master changelog:
   ```xml
   <!-- db/changeLog.xml -->
   <include file="db/changelog/006-my-change.xml"/>
   ```
3. Rebuild and restart the service — Liquibase runs automatically on startup.

**Clear a stuck Liquibase lock:**
```bash
PGPASSWORD=admin1 psql -h localhost -U admin -d personalfinance \
  -c "DELETE FROM budget_schema.databasechangeloglock;"
```

---

## Project Structure

```
personal-finance/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                 # App Router pages + API routes
│   │   ├── components/          # React components
│   │   └── lib/api/             # Typed API clients
│   └── Dockerfile
│
├── services/
│   ├── user-service/            # Quarkus — preferences + avatars
│   ├── budget-service/          # Quarkus — expense types + budgets
│   └── transaction-service/     # Quarkus — transactions + aggregations
│       └── src/main/
│           ├── java/            # Java source
│           └── resources/
│               ├── application.properties
│               └── db/changelog/   # Liquibase changesets
│
├── infrastructure/
│   ├── db/init.sql              # Schema creation (runs once on first postgres start)
│   └── keycloak/setup-keycloak.sh
│
├── data/avatars/                # User avatar uploads (bind-mounted into user-service)
├── docs/                        # Technical docs (this file, SSL guide)
│
├── docker-compose.infra.yml     # Infrastructure layer
├── docker-compose.services.yml  # Backend services layer
├── docker-compose.frontend.yml  # Frontend layer
├── docker-compose.yml           # Full-stack convenience file
├── Makefile                     # Common operations
├── deploy.sh                    # Deployment script
├── start.sh                     # Start without rebuilding
└── stop.sh                      # Stop without removing data
```

---

## Code Conventions

### Java (Quarkus)

- Packages: `com.personalfinance.[service].[layer]`
- REST resources: `@Path("/api/v1/...")`
- Entities use Panache Active Record pattern
- Bean Validation on all request DTOs
- Record types for DTOs (immutable)

### TypeScript (Next.js)

- Named exports for all components
- API clients in `src/lib/api/` — one file per service
- Server-side calls use internal Docker URLs (`USER_SERVICE_URL`)
- Browser calls use public env vars (`NEXT_PUBLIC_*`)
- Avoid `any` — type all API responses

---

## SSL / TLS

See [SSL-CERTIFICATES.md](./SSL-CERTIFICATES.md) for reverse-proxy and HTTPS configuration.

---

## Troubleshooting

### Keycloak login redirects to `keycloak:8080` instead of `localhost`
Ensure `.env` has `KC_HOSTNAME=localhost` and `KEYCLOAK_ISSUER=http://localhost:8080/realms/personal-finance`.

### Service fails to connect to database
Check infra is healthy: `docker compose -f docker-compose.infra.yml ps`

### Port already in use
```bash
lsof -i :8082    # find the process
```

### Liquibase lock prevents startup
```bash
PGPASSWORD=admin1 psql -h localhost -U admin -d personalfinance \
  -c "DELETE FROM budget_schema.databasechangeloglock;"
```
