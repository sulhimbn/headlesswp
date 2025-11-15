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
curl -s -b /tmp/cookies.txt \
  -X POST \
  http://localhost:8080/wp-admin/install.php?step=2 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "weblog_title=Headless WP Site&user_name=admin&admin_password=admin123&admin_password2=admin123&admin_email=admin@example.com&Submit=Install+WordPress${SETUP_KEY:+&setup_key=${SETUP_KEY#value=}}"

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