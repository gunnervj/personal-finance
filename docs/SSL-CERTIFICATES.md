# SSL/TLS Certificate Configuration Guide

## Overview

When deploying behind a reverse proxy (HAProxy, nginx, traefik) with HTTPS, you need to handle SSL certificates properly. This guide explains the options and security implications.

## The Problem

When using HTTPS with self-signed certificates, Next.js (Node.js) will reject the connection:

```
[next-auth][error][SIGNIN_OAUTH_ERROR] self-signed certificate
```

This happens because Node.js validates SSL certificates by default for security.

## Solutions

### Option 1: Disable SSL Verification (Development Only)

**⚠️ WARNING: Use only for development/testing with self-signed certificates!**

In your `.env` file:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Security Implications:**
- Disables SSL certificate validation
- Vulnerable to man-in-the-middle attacks
- Should NEVER be used in production
- Only acceptable for:
  - Local development
  - Internal networks with self-signed certs
  - Testing environments

### Option 2: Use Valid SSL Certificates (Recommended for Production)

Use proper SSL certificates from a Certificate Authority (CA):

#### Free Option: Let's Encrypt

**1. Install Certbot:**
```bash
# Ubuntu/Debian
sudo apt-get install certbot

# RHEL/CentOS
sudo yum install certbot
```

**2. Generate Certificates:**
```bash
# For HAProxy
sudo certbot certonly --standalone -d app.rudra.core -d keycloak.rudra.core -d api.rudra.core

# Combine for HAProxy
cat /etc/letsencrypt/live/rudra.core/fullchain.pem \
    /etc/letsencrypt/live/rudra.core/privkey.pem > \
    /etc/haproxy/certs/rudra.core.pem
```

**3. Configure HAProxy:**
```haproxy
frontend https_frontend
    bind *:443 ssl crt /etc/haproxy/certs/rudra.core.pem
    # ... rest of config
```

**4. Update .env:**
```bash
# Remove or leave empty - valid certs don't need this!
NODE_TLS_REJECT_UNAUTHORIZED=
```

**5. Set up Auto-Renewal:**
```bash
# Add to crontab
0 0 * * * certbot renew --quiet && cat /etc/letsencrypt/live/rudra.core/fullchain.pem /etc/letsencrypt/live/rudra.core/privkey.pem > /etc/haproxy/certs/rudra.core.pem && systemctl reload haproxy
```

#### Commercial CA Certificates

If using commercial certificates (Comodo, DigiCert, etc.):

1. Purchase certificate for your domain
2. Generate CSR (Certificate Signing Request)
3. Receive certificate from CA
4. Install in HAProxy
5. Remove `NODE_TLS_REJECT_UNAUTHORIZED` from .env

### Option 3: Add Self-Signed Cert to Trusted Store (Advanced)

For internal deployments where you want to keep self-signed certs but make them trusted:

**1. Create CA and Certificate:**
```bash
# Create CA
openssl req -new -x509 -days 3650 -keyout ca-key.pem -out ca-cert.pem

# Create certificate
openssl req -newkey rsa:2048 -nodes -keyout server-key.pem -out server-req.pem
openssl x509 -req -in server-req.pem -days 3650 -CA ca-cert.pem -CAkey ca-key.pem -set_serial 01 -out server-cert.pem

# Combine for HAProxy
cat server-cert.pem server-key.pem > /etc/haproxy/certs/rudra.core.pem
```

**2. Add CA to Docker Image:**

Create `frontend/Dockerfile.prod`:
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy CA certificate
COPY ca-cert.pem /usr/local/share/ca-certificates/rudra-ca.crt

# Update CA certificates
RUN apk add --no-cache ca-certificates && \
    update-ca-certificates

# ... rest of Dockerfile
```

**3. Rebuild Frontend:**
```bash
docker-compose build frontend
docker-compose up -d frontend
```

## Recommended Approach by Environment

| Environment | Recommendation | Configuration |
|-------------|---------------|---------------|
| **Local Development** | HTTP (no SSL) | `FRONTEND_URL=http://localhost:3000` |
| **Dev Server (self-signed)** | Disable verification | `NODE_TLS_REJECT_UNAUTHORIZED=0` |
| **Internal Network** | Self-signed + CA trust | Add CA to container |
| **Production** | Let's Encrypt | Valid certificates, remove override |
| **Enterprise Production** | Commercial CA | Valid certificates, remove override |

## Security Best Practices

1. **Never** use `NODE_TLS_REJECT_UNAUTHORIZED=0` in production
2. **Always** use valid SSL certificates for public-facing applications
3. **Rotate** certificates before expiration (Let's Encrypt: 90 days)
4. **Monitor** certificate expiration dates
5. **Use** strong cipher suites in HAProxy/nginx
6. **Enable** HSTS (HTTP Strict Transport Security) for production

## HAProxy SSL Best Practices

```haproxy
# Strong SSL configuration
ssl-default-bind-ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384
ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

frontend https_frontend
    bind *:443 ssl crt /etc/haproxy/certs/rudra.core.pem

    # Security headers
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    http-response set-header X-Frame-Options "SAMEORIGIN"
    http-response set-header X-Content-Type-Options "nosniff"

    # ... routing config
```

## Troubleshooting

### Certificate Chain Issues

If you get "unable to verify the first certificate":
```bash
# Check certificate chain
openssl s_client -connect keycloak.rudra.core:443 -showcerts

# Make sure fullchain.pem includes intermediate certificates
```

### Certificate Not Trusted

```bash
# Check which CA signed the certificate
openssl x509 -in /etc/haproxy/certs/rudra.core.pem -text -noout | grep Issuer

# Verify certificate matches domain
openssl x509 -in /etc/haproxy/certs/rudra.core.pem -text -noout | grep Subject
```

### Let's Encrypt Rate Limits

- 50 certificates per registered domain per week
- Use staging environment for testing:
```bash
certbot certonly --staging -d app.rudra.core
```

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [HAProxy SSL Configuration](https://www.haproxy.com/documentation/hapee/latest/security/tls/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
