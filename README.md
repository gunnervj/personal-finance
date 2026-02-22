# Personal Finance

A personal finance management application that helps you plan budgets, track spending, and monitor your financial health — all in one place.

---

## What it does

Personal Finance gives you a clear picture of where your money goes each month. You set a yearly budget across your own expense categories, record transactions as you spend, and the app keeps you updated in real time on how you're tracking.

---

## Features

### Dashboard

The dashboard is your financial at-a-glance view for the current month.

- **Expense Summary** — total spent this month vs your budget, with a colour-coded burn indicator (green under 50%, orange 50–80%, red 80%+)
- **Emergency Fund** — progress toward your emergency fund target based on your mandatory expenses and savings goal
- **Expense Distribution** — donut chart showing spending by category; navigate back through previous months
- **Monthly Comparison** — bar chart of monthly spending for the current year vs the previous year
- **Burn Rate** — per-category breakdown of budget consumed this month; navigate to any past month
- **Accumulated Budget** — for categories marked as "accumulate", unspent amounts carry forward month to month; the widget shows your running pool and how much of it you've used
- **Recent Transactions** — latest five transactions at a glance

### Budget Management

- Create a yearly budget with any mix of recurring monthly expenses and one-time expenses (assigned to a specific month)
- **Custom expense types** — create your own categories (Rent, Groceries, Travel, etc.) with a chosen icon, and mark each as mandatory or optional
  - **Mandatory** expenses feed the emergency fund calculation
  - **Accumulate** flag — unspent budget from this category rolls forward rather than resetting each month
- Budget creation rules: current year always available; next year only available in December; past years cannot be created
- Edit a budget at any time to adjust amounts, add or remove categories
- Delete a budget only if it has no recorded transactions
- Live summary while editing: see your recurring total as a percentage of salary and the implied monthly savings

### Transactions

- Record an expense against any budget category
- The expense type picker shows each category colour-coded by current burn rate (green = under budget, yellow = near limit, red = overspent) with the percentage of budget remaining shown inline
- Edit or delete any transaction
- Transactions table sorted newest first, loaded in pages of 10

### User Preferences

Set once on first login, editable any time from the user menu:

- **Currency** (default USD)
- **After-tax monthly salary** — used to show budget-as-percentage-of-salary
- **Emergency fund target** (in months of mandatory expenses)
- **Current emergency fund savings** — tracked separately so you can see progress

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Start the application

```bash
# First-time setup — builds and starts everything
./deploy.sh

# After a machine restart (no rebuild needed)
./start.sh

# Stop without losing data
./stop.sh
```

Open **http://localhost:3000** and register with your email address.

---

## Recommended first-run workflow

1. **Register** — create an account with your email and a password
2. **Set preferences** — enter your monthly salary, currency, and emergency fund target (the modal opens automatically on first login)
3. **Create expense types** — go to Budgets → Expense Types and add your spending categories
4. **Create a budget** — go to Budgets → Create Budget, assign monthly amounts to each category
5. **Record transactions** — use the "+" button on the Transactions page to log your spending
6. **Check the dashboard** — watch your burn rate, distribution, and savings picture update in real time

---

## Deployment

For targeted redeploys (e.g. after a code change) without restarting the database or Keycloak:

```bash
./deploy.sh services   # rebuild backend only
./deploy.sh frontend   # rebuild frontend only
./deploy.sh apps       # rebuild backend + frontend
```

See [docs/technical.md](docs/technical.md) for the full deployment reference, database schema, architecture details, and troubleshooting.

---

## Tech Stack (summary)

- **Frontend** — Next.js, React, TypeScript, TailwindCSS
- **Backend** — Quarkus microservices (Java)
- **Auth** — Keycloak (OIDC)
- **Database** — PostgreSQL

Full technical documentation: [docs/technical.md](docs/technical.md)
