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
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="personal-finance"
FRONTEND_CLIENT_ID="frontend"
BACKEND_CLIENT_ID="backend"
BACKEND_CLIENT_SECRET="backend-secret"

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
      \"redirectUris\": [\"http://localhost:3000/*\"],
      \"webOrigins\": [\"http://localhost:3000\"],
      \"attributes\": {
        \"post.logout.redirect.uris\": \"http://localhost:3000/*\"
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
      \"redirectUris\": [\"http://localhost:3000/*\"],
      \"webOrigins\": [\"http://localhost:3000\"],
      \"attributes\": {
        \"post.logout.redirect.uris\": \"http://localhost:3000/*\"
      }
    }"
  # Get the newly created client UUID
  FRONTEND_CLIENT_UUID=$(curl -s \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${FRONTEND_CLIENT_ID}" \
    | sed -n 's/.*"id":"\([^"]*\)".*"clientId":"frontend".*/\1/p')
fi
echo "Frontend client configured."

# Create or update backend client (confidential)
echo "Setting up backend client..."
BACKEND_CLIENT_RESPONSE=$(curl -s \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${BACKEND_CLIENT_ID}")

BACKEND_CLIENT_UUID=""
if echo "$BACKEND_CLIENT_RESPONSE" | grep -q "\"clientId\":\"${BACKEND_CLIENT_ID}\""; then
  BACKEND_CLIENT_UUID=$(echo "$BACKEND_CLIENT_RESPONSE" | sed -n 's/.*"id":"\([^"]*\)".*"clientId":"backend".*/\1/p')
  echo "Backend client already exists (UUID: ${BACKEND_CLIENT_UUID}). Updating..."
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${BACKEND_CLIENT_UUID}" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${BACKEND_CLIENT_ID}\",
      \"enabled\": true,
      \"publicClient\": false,
      \"secret\": \"${BACKEND_CLIENT_SECRET}\",
      \"directAccessGrantsEnabled\": false,
      \"serviceAccountsEnabled\": true,
      \"standardFlowEnabled\": false
    }"
else
  echo "Creating backend client..."
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"clientId\": \"${BACKEND_CLIENT_ID}\",
      \"enabled\": true,
      \"publicClient\": false,
      \"secret\": \"${BACKEND_CLIENT_SECRET}\",
      \"directAccessGrantsEnabled\": false,
      \"serviceAccountsEnabled\": true,
      \"standardFlowEnabled\": false
    }"
fi
echo "Backend client configured."

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
echo "Backend Client: ${BACKEND_CLIENT_ID} (confidential)"
echo "Registration: enabled (email as username)"
echo "Keycloak Admin: ${KEYCLOAK_URL}/admin"
