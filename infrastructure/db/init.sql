-- Create schemas for each microservice
-- Tables are managed by Liquibase within each service

CREATE SCHEMA IF NOT EXISTS user_schema;
CREATE SCHEMA IF NOT EXISTS budget_schema;
CREATE SCHEMA IF NOT EXISTS transaction_schema;
