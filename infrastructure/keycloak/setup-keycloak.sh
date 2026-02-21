#!/bin/sh
# Keycloak Realm Setup Script
# This script is idempotent - safe to re-run.
# It uses the Keycloak Admin REST API to configure:
#   - personal-finance realm
#   - Email as username
#   - User registration enabled
#   - frontend client (public, authorization code flow)
#   - backend client (confidential, for service JWT validation)
#   - Email claim in access tokens

set -e

KEYCLOAK_URL="http://keycloak:8080"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM_NAME="personal-finance"
FRONTEND_CLIENT_ID="frontend"

# Domain configuration from environment (defaults to localhost)
APP_DOMAIN="${APP_DOMAIN:-localhost}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Backend service clients (one per microservice)
USER_SERVICE_CLIENT="user-service"
USER_SERVICE_SECRET="user-service-secret"
BUDGET_SERVICE_CLIENT="budget-service"
BUDGET_SERVICE_SECRET="budget-service-secret"
TRANSACTION_SERVICE_CLIENT="transaction-service"
TRANSACTION_SERVICE_SECRET="transaction-service-secret"

echo "=== Keycloak Setup Script ==="
echo "Waiting for Keycloak to be fully ready..."
sleep 5

# Get admin access token
echo "Getting admin access token..."
ADMIN_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USER}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: Failed to get admin token"
  exit 1
fi
echo "Admin token obtained."

# Update master realm to not require SSL (for local development)
echo "Configuring master realm for HTTP access..."
curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/master" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"sslRequired": "none"}'
echo "Master realm configured for HTTP."

# Check if realm already exists
echo "Checking if realm '${REALM_NAME}' exists..."
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}")

if [ "$REALM_EXISTS" = "200" ]; then
  echo "Realm '${REALM_NAME}' already exists. Updating configuration..."
else
  echo "Creating realm '${REALM_NAME}'..."
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"realm\": \"${REALM_NAME}\",
      \"enabled\": true,
      \"registrationAllowed\": true,
      \"registrationEmailAsUsername\": true,
      \"loginWithEmailAllowed\": true,
      \"duplicateEmailsAllowed\": false,
      \"resetPasswordAllowed\": true,
      \"editUsernameAllowed\": false,
      \"sslRequired\": \"none\"
    }"
  echo "Realm created."
fi

# Update realm settings (idempotent)
echo "Updating realm settings..."
curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"registrationAllowed\": true,
    \"registrationEmailAsUsername\": true,
    \"loginWithEmailAllowed\": true,
    \"duplicateEmailsAllowed\": false,
    \"resetPasswordAllowed\": true,
    \"editUsernameAllowed\": false,
    \"sslRequired\": \"none\",
    \"accessTokenLifespan\": 1800,
    \"ssoSessionIdleTimeout\": 1800,
    \"ssoSessionMaxLifespan\": 36000
  }"
echo "Realm settings updated."

# Create or update frontend client (public)
echo "Setting up frontend client..."
FRONTEND_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${FRONTEND_CLIENT_ID}")

# Get client list and check if frontend exists
FRONTEND_CLIENT_RESPONSE=$(curl -s \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${FRONTEND_CLIENT_ID}")

# Check if response contains the client
FRONTEND_CLIENT_UUID=""
if echo "$FRONTEND_CLIENT_RESPONSE" | grep -q "\"clientId\":\"${FRONTEND_CLIENT_ID}\""; then
  FRONTEND_CLIENT_UUID=$(echo "$FRONTEND_CLIENT_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*"clientId":"frontend".*/\1/p')
  echo "Frontend client already exists (UUID: ${FRONTEND_CLIENT_UUID}). Updating..."
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${FRONTEND_CLIENT_UUID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${FRONTEND_CLIENT_ID}\",
      \"enabled\": true,
      \"publicClient\": true,
      \"directAccessGrantsEnabled\": true,
      \"standardFlowEnabled\": true,
      \"redirectUris\": [\"http://${APP_DOMAIN}:${FRONTEND_PORT}/*\"],
      \"webOrigins\": [\"http://${APP_DOMAIN}:${FRONTEND_PORT}\"],
      \"attributes\": {
        \"post.logout.redirect.uris\": \"http://${APP_DOMAIN}:${FRONTEND_PORT}/*\"
      }
    }"
else
  echo "Creating frontend client..."
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${FRONTEND_CLIENT_ID}\",
      \"enabled\": true,
      \"publicClient\": true,
      \"directAccessGrantsEnabled\": true,
      \"standardFlowEnabled\": true,
      \"redirectUris\": [\"http://${APP_DOMAIN}:${FRONTEND_PORT}/*\"],
      \"webOrigins\": [\"http://${APP_DOMAIN}:${FRONTEND_PORT}\"],
      \"attributes\": {
        \"post.logout.redirect.uris\": \"http://${APP_DOMAIN}:${FRONTEND_PORT}/*\"
      }
    }"
  # Get the newly created client UUID
  FRONTEND_CLIENT_UUID=$(curl -s \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${FRONTEND_CLIENT_ID}" \
    | sed -n 's/.*"id":"\([^"]*\)".*"clientId":"frontend".*/\1/p')
fi
echo "Frontend client configured."

# Function to create or update a backend service client
create_backend_client() {
  local CLIENT_ID=$1
  local CLIENT_SECRET=$2

  echo "Setting up ${CLIENT_ID} client..."
  local CLIENT_RESPONSE=$(curl -s \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}")

  if echo "$CLIENT_RESPONSE" | grep -q "\"clientId\":\"${CLIENT_ID}\""; then
    local CLIENT_UUID=$(echo "$CLIENT_RESPONSE" | sed -n "s/.*\"id\":\"\([^\"]*\)\".*\"clientId\":\"${CLIENT_ID}\".*/\1/p")
    echo "${CLIENT_ID} already exists (UUID: ${CLIENT_UUID}). Updating..."
    curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"clientId\": \"${CLIENT_ID}\",
        \"enabled\": true,
        \"publicClient\": false,
        \"secret\": \"${CLIENT_SECRET}\",
        \"directAccessGrantsEnabled\": false,
        \"serviceAccountsEnabled\": true,
        \"standardFlowEnabled\": false
      }"
  else
    echo "Creating ${CLIENT_ID}..."
    curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"clientId\": \"${CLIENT_ID}\",
        \"enabled\": true,
        \"publicClient\": false,
        \"secret\": \"${CLIENT_SECRET}\",
        \"directAccessGrantsEnabled\": false,
        \"serviceAccountsEnabled\": true,
        \"standardFlowEnabled\": false
      }"
  fi
  echo "${CLIENT_ID} configured."
}

# Create backend service clients
create_backend_client "${USER_SERVICE_CLIENT}" "${USER_SERVICE_SECRET}"
create_backend_client "${BUDGET_SERVICE_CLIENT}" "${BUDGET_SERVICE_SECRET}"
create_backend_client "${TRANSACTION_SERVICE_CLIENT}" "${TRANSACTION_SERVICE_SECRET}"

# Add email protocol mapper to frontend client to ensure email is in access token
echo "Adding email protocol mapper to frontend client..."
if [ -n "$FRONTEND_CLIENT_UUID" ]; then
  # Check if mapper already exists
  MAPPER_EXISTS=$(curl -s \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${FRONTEND_CLIENT_UUID}/protocol-mappers/models" \
    | grep -c '"name":"email"' || true)

  if [ "$MAPPER_EXISTS" = "0" ]; then
    curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${FRONTEND_CLIENT_UUID}/protocol-mappers/models" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"email\",
        \"protocol\": \"openid-connect\",
        \"protocolMapper\": \"oidc-usermodel-property-mapper\",
        \"config\": {
          \"user.attribute\": \"email\",
          \"claim.name\": \"email\",
          \"jsonType.label\": \"String\",
          \"id.token.claim\": \"true\",
          \"access.token.claim\": \"true\",
          \"userinfo.token.claim\": \"true\"
        }
      }"
    echo "Email mapper added to frontend client."
  else
    echo "Email mapper already exists on frontend client."
  fi
fi

echo ""
echo "=== Keycloak Setup Complete ==="
echo "Realm: ${REALM_NAME}"
echo "Frontend Client: ${FRONTEND_CLIENT_ID} (public)"
echo "Backend Clients (confidential):"
echo "  - ${USER_SERVICE_CLIENT}"
echo "  - ${BUDGET_SERVICE_CLIENT}"
echo "  - ${TRANSACTION_SERVICE_CLIENT}"
echo "Registration: enabled (email as username)"
echo "Keycloak Admin: ${KEYCLOAK_URL}/admin"
