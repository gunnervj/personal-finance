# Personal Finance Management System

A comprehensive personal finance management application built with microservices architecture, enabling users to manage budgets, track expenses, and monitor financial health.

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 15 with App Router
- React 19
- TypeScript
- TailwindCSS (dark mode)
- Planned: React Query, Chart.js, Framer Motion

**Backend:**
- Quarkus 3.31.3 (Java)
- 3 Microservices: user-service, budget-service, transaction-service
- RESTful APIs with JSON
- Liquibase for database migrations
- OIDC for authentication

**Infrastructure:**
- PostgreSQL 16 (multi-schema)
- Keycloak 24.0 (authentication & authorization)
- Docker Compose (local development)

### Microservices

| Service | Port | Responsibility |
|---------|------|----------------|
| **user-service** | 8081 | User preferences, avatar management |
| **budget-service** | 8082 | Expense types, budgets, budget items |
| **transaction-service** | 8083 | Transaction CRUD, aggregations |
| **Keycloak** | 8080 | Authentication, user management |
| **Frontend** | 3000 | Next.js UI (not yet started) |

## 🚀 Quick Start

### Prerequisites

- Docker Desktop
- Node.js 22+
- Maven 3.9+ (installed via Homebrew)
- Quarkus CLI 3.31+ (installed via Homebrew)

### Starting the Application

```bash
# Clone the repository
cd personal-finance

# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f user-service
```

### Accessing Services

- **Keycloak Admin Console**: http://localhost:8080/admin
  - Username: `admin`
  - Password: `admin`
  - Realm: `personal-finance`

- **Health Endpoints**:
  - user-service: http://localhost:8081/q/health
  - budget-service: http://localhost:8082/q/health
  - transaction-service: http://localhost:8083/q/health

- **Database**:
  ```bash
  docker exec -it personal-finance-postgres-1 psql -U admin -d personalfinance
  ```

## 📊 Database Schema

### user_schema

**user_preferences**
```sql
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE (user identifier)
- preferences: JSONB (extensible settings)
- avatar_path: VARCHAR(500) (optional custom avatar)
- created_at, updated_at: TIMESTAMP
```

Default preferences structure:
```json
{
  "currency": "USD",
  "emergency_fund_months": 3,
  "after_tax_monthly_salary": 0.00
}
```

### budget_schema

**expense_types**
```sql
- id: UUID (PK)
- user_email: VARCHAR(255)
- name: VARCHAR(100)
- icon: VARCHAR(50) (Lucide icon name)
- is_mandatory: BOOLEAN
- UNIQUE(user_email, name)
```

**budgets**
```sql
- id: UUID (PK)
- user_email: VARCHAR(255)
- year: INTEGER
- month: INTEGER (1-12)
- UNIQUE(user_email, year, month)
```

**budget_items**
```sql
- id: UUID (PK)
- budget_id: UUID (FK → budgets CASCADE)
- expense_type_id: UUID (FK → expense_types RESTRICT)
- amount: DECIMAL(12,2)
- is_one_time: BOOLEAN
- UNIQUE(budget_id, expense_type_id)
```

### transaction_schema

**transactions**
```sql
- id: UUID (PK)
- user_email: VARCHAR(255)
- budget_item_id: UUID
- expense_type_id: UUID (denormalized for queries)
- amount: DECIMAL(12,2)
- description: VARCHAR(500)
- transaction_date: DATE
- Indexes: (user_email, transaction_date), (user_email, expense_type_id)
```

## 🔐 Authentication

### Keycloak Configuration

**Realm**: `personal-finance`

**Clients**:
- `frontend` (public) - Authorization code flow for Next.js
- `backend` (confidential) - JWT validation for microservices

**Features**:
- Email as username (users log in with email)
- User registration enabled
- Email claim included in JWT access tokens
- Password reset enabled

### Auto-Configuration

Keycloak is automatically configured on startup via `/infrastructure/keycloak/setup-keycloak.sh`:
- Creates realm and clients
- Configures email as username
- Adds email protocol mapper
- Idempotent (safe to re-run)

## 🛠️ Development

### Building Services

```bash
# Build specific service
docker-compose build user-service

# Build all services
docker-compose build

# Rebuild without cache
docker-compose build --no-cache
```

### Database Migrations

Migrations are managed by Liquibase and run automatically on service startup.

**Location**: `services/*/src/main/resources/db/changelog/`

**Viewing migration status**:
```bash
# Connect to database
docker exec -it personal-finance-postgres-1 psql -U admin -d personalfinance

# Check migration history
SELECT * FROM user_schema.databasechangelog;
SELECT * FROM budget_schema.databasechangelog;
SELECT * FROM transaction_schema.databasechangelog;
```

### Adding New Migrations

1. Create new changeset file:
   ```xml
   <!-- services/user-service/src/main/resources/db/changelog/002-add-column.xml -->
   <changeSet id="002-add-new-column" author="your-name">
     <addColumn tableName="user_preferences" schemaName="user_schema">
       <column name="new_field" type="VARCHAR(100)"/>
     </addColumn>
   </changeSet>
   ```

2. Include in master changelog:
   ```xml
   <!-- db/changeLog.xml -->
   <include file="db/changelog/002-add-column.xml"/>
   ```

3. Rebuild and restart service

### Logs

```bash
# View all logs
docker-compose logs

# Follow specific service
docker-compose logs -f user-service

# View last 100 lines
docker-compose logs --tail=100 budget-service
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (DESTROYS DATA)
docker-compose down -v

# Stop specific service
docker-compose stop user-service
```

## 📁 Project Structure

```
personal-finance/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   └── components/         # React components
│   ├── Dockerfile
│   └── package.json
│
├── services/                    # Quarkus microservices
│   ├── user-service/
│   │   ├── src/main/
│   │   │   ├── java/           # Java source code
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── db/         # Liquibase changelogs
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── budget-service/         # Same structure
│   └── transaction-service/    # Same structure
│
├── infrastructure/
│   ├── db/
│   │   └── init.sql            # Schema creation
│   └── keycloak/
│       └── setup-keycloak.sh   # Realm auto-configuration
│
├── data/
│   └── avatars/                # User avatar uploads (volume mount)
│
├── docker-compose.yml          # Service orchestration
├── .gitignore
├── README.md                   # This file
└── PROGRESS.md                 # Implementation progress
```

## 🔒 Security Considerations

- ✅ Email as unique user identifier (no separate usernames)
- ✅ JWT-based authentication via Keycloak
- ✅ Each microservice validates JWTs independently
- ✅ CORS configured for frontend origin only
- ✅ Database credentials in environment (not committed)
- ✅ Foreign key constraints prevent orphaned data
- ⚠️ TLS verification disabled (development only)
- ⚠️ Passwords in docker-compose (development only)

**For Production**: Use secrets management, enable TLS, use strong passwords, implement rate limiting.

## 🧪 Testing

### Manual Testing

1. **Register a user**:
   - Navigate to http://localhost:8080/realms/personal-finance/account
   - Click "Register"
   - Use email as username

2. **Verify database**:
   ```bash
   docker exec -it personal-finance-postgres-1 psql -U admin -d personalfinance
   \dt user_schema.*
   SELECT * FROM user_schema.user_preferences;
   ```

3. **Test health endpoints**:
   ```bash
   curl http://localhost:8081/q/health
   curl http://localhost:8082/q/health
   curl http://localhost:8083/q/health
   ```

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild if needed
docker-compose up -d --build [service-name]
```

### Database connection errors

```bash
# Check Postgres is healthy
docker-compose ps postgres

# Check database exists
docker exec personal-finance-postgres-1 psql -U admin -l
```

### Liquibase lock issues

```bash
# Clear lock manually
docker exec personal-finance-postgres-1 psql -U admin -d personalfinance \
  -c "DELETE FROM user_schema.databasechangeloglock;"
```

### Port conflicts

```bash
# Check what's using the port
lsof -i :8081

# Change port in docker-compose.yml if needed
```

## 📝 Code Standards

### Java (Quarkus)

- **Naming**: PascalCase for classes, camelCase for methods/variables
- **Packages**: `com.personalfinance.[service].[layer]`
- **REST Resources**: `@Path("/api/v1/...")`
- **Panache**: Use Active Record pattern for entities
- **Validation**: Use Bean Validation annotations
- **Error Handling**: Return proper HTTP status codes

### TypeScript (Next.js)

- **Naming**: PascalCase for components, camelCase for functions
- **File Structure**: Collocate related files
- **Exports**: Named exports for components
- **Types**: Explicit types, avoid `any`
- **Components**: Functional components with hooks

### General Principles

- ✅ Single Responsibility Principle
- ✅ DRY (Don't Repeat Yourself)
- ✅ Meaningful variable names
- ✅ Small, focused functions
- ✅ No premature optimization
- ✅ Security first (validate inputs, sanitize outputs)

## 🚧 Current Status

**Phase 1: Infrastructure** - ✅ **COMPLETE**
- All backend services running
- Database schemas created
- Keycloak configured
- Health checks passing

**Phase 2: Authentication Flow** - ⏳ **NEXT**
- Next.js auth integration
- Login/logout flow
- Protected routes

See [PROGRESS.md](./PROGRESS.md) for detailed implementation status.

## 🤝 Contributing

This is a personal project. Contributions are welcome via pull requests.

## 📄 License

Private project - All rights reserved.

## 📧 Contact

For questions or issues, please create an issue in the repository.
