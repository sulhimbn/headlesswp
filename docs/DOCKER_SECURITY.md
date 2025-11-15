# Docker Security Setup

This document explains the secure Docker configuration for the Headless WordPress project.

## Environment Variables

The Docker setup uses environment variables to ensure no credentials are hardcoded in the configuration files.

### Database Credentials

The following environment variables must be set in your `.env` file:

```bash
# Database Configuration (Docker)
MYSQL_DATABASE=wordpress
MYSQL_USER=wordpress
MYSQL_PASSWORD=your_secure_mysql_password_here
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
```

## Security Best Practices

1. **Generate Strong Passwords**: Use the following command to generate secure passwords:
   ```bash
   openssl rand -base64 32
   ```

2. **Environment File Protection**: Ensure `.env` files are never committed to version control:
   ```bash
   # .gitignore should include:
   .env
   .env.local
   .env.production
   ```

3. **Production Deployment**: In production, use proper secret management solutions like:
   - Docker Secrets
   - Kubernetes Secrets
   - AWS Secrets Manager
   - Azure Key Vault

## Services

### WordPress
- **Port**: 8080
- **Database**: Uses environment variables for secure connection

### MySQL Database
- **Version**: 8.0
- **Credentials**: Configured via environment variables
- **Data persistence**: Stored in Docker volumes

### phpMyAdmin
- **Port**: 8081
- **Access**: http://localhost:8081
- **Authentication**: Uses secure root password from environment

## Startup

To start the services with secure credentials:

```bash
# Ensure your .env file is configured with secure passwords
docker compose up -d
```

## Verification

After startup, verify that:
1. WordPress is accessible at http://localhost:8080
2. phpMyAdmin is accessible at http://localhost:8081
3. No default credentials are used anywhere in the configuration