#!/bin/bash

# WordPress Installation Script
# This script automates the WordPress 5-minute installation

echo "Starting WordPress installation..."

# Get WordPress installation page to extract cookies
echo "Fetching installation page..."
INSTALL_PAGE=$(curl -s -c /tmp/cookies.txt http://localhost:8080/wp-admin/install.php)

# Extract the setup key if present
SETUP_KEY=$(echo "$INSTALL_PAGE" | grep -o 'name="setup_key"[^>]*value="[^"]*' | sed 's/.*value="//')

# Submit installation form
echo "Submitting installation form..."
ADMIN_USER=${WP_ADMIN_USER:-admin}
ADMIN_PASSWORD=${WP_ADMIN_PASSWORD:-$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)}
ADMIN_EMAIL=${WP_ADMIN_EMAIL:-admin@example.com}
curl -s -b /tmp/cookies.txt \
  -X POST \
  http://localhost:8080/wp-admin/install.php?step=2 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "weblog_title=Headless WP Site&user_name=${ADMIN_USER}&admin_password=${ADMIN_PASSWORD}&admin_password2=${ADMIN_PASSWORD}&admin_email=${ADMIN_EMAIL}&Submit=Install+WordPress${SETUP_KEY:+&setup_key=${SETUP_KEY#value=}}"

echo "Installation submitted. Checking status..."

# Check if installation was successful
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-json/wp/v2)

if [ "$STATUS" = "200" ]; then
    echo "✅ WordPress installation successful!"
    echo "API is accessible at http://localhost:8080/wp-json/wp/v2"
else
    echo "❌ Installation may have failed. Status code: $STATUS"
    echo "Checking WordPress homepage..."
    curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
fi

# Clean up
rm -f /tmp/cookies.txt

# Display credentials (only in development)
if [ "$NODE_ENV" = "development" ]; then
  echo ""
  echo "WordPress installation complete!"
  echo "Admin User: $ADMIN_USER"
  echo "Admin Password: $ADMIN_PASSWORD"
  echo "Admin Email: $ADMIN_EMAIL"
  echo ""
  echo "⚠️  WARNING: Please change these credentials in production!"
  echo "   Set WP_ADMIN_USER, WP_ADMIN_PASSWORD, WP_ADMIN_EMAIL in .env"
fi