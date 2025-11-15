#!/bin/bash

# WordPress Configuration Script for Headless Setup
echo "Configuring WordPress for headless use..."

# Login to WordPress and get session cookie
echo "Logging in to WordPress..."
LOGIN_RESPONSE=$(curl -s -c /tmp/wp-cookies.txt \
  -X POST \
  http://localhost:8080/wp-login.php \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "log=admin&pwd=admin123&rememberme=forever&wp-submit=Log+In&redirect_to=http%3A%2F%2Flocalhost%3A8080%2Fwp-admin%2F&testcookie=1")

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q "login-error"; then
    echo "❌ Login failed"
    exit 1
fi

echo "✅ Login successful"

# Enable pretty permalinks (required for REST API)
echo "Setting up permalinks..."
PERMALINK_RESPONSE=$(curl -s -b /tmp/wp-cookies.txt \
  -X POST \
  http://localhost:8080/wp-admin/options-permalink.php \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "selection=post_name&permalink_structure=%postname%&submit=Save+Changes&_wpnonce=$(curl -s -b /tmp/wp-cookies.txt http://localhost:8080/wp-admin/options-permalink.php | grep -o '_wpnonce.*value="[^"]*' | sed 's/.*value="//' | sed 's/".*//')")

# Enable REST API if needed
echo "Enabling REST API..."
REST_API_RESPONSE=$(curl -s -b /tmp/wp-cookies.txt \
  -X POST \
  http://localhost:8080/wp-admin/options.php \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "option_page=general&action=update&_wpnonce=$(curl -s -b /tmp/wp-cookies.txt http://localhost:8080/wp-admin/options-general.php | grep -o '_wpnonce.*value="[^"]*' | sed 's/.*value="//' | sed 's/".*//')&blogname=Headless+WP+Site&blog_description=Headless+WordPress+site&siteurl=http%3A%2F%2Flocalhost%3A8080&home=http%3A%2F%2Flocalhost%3A8080&admin_email=admin%40example.com&users_can_register=0&default_role=subscriber&timezone_string=UTC&date_format=F+j%2C+Y&time_format+g%3Ai+a&start_of_week=1&language=&WPLANG=en_US")

# Test API endpoints
echo "Testing API endpoints..."
sleep 2

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-json/wp/v2)
echo "API Status: $API_STATUS"

if [ "$API_STATUS" = "200" ]; then
    echo "✅ REST API is now accessible!"
    
    # Test posts endpoint
    POSTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-json/wp/v2/posts)
    echo "Posts API Status: $POSTS_STATUS"
    
    if [ "$POSTS_STATUS" = "200" ]; then
        echo "✅ Posts API is working!"
        echo "Sample posts response:"
        curl -s http://localhost:8080/wp-json/wp/v2/posts | head -5
    else
        echo "⚠️ Posts API returned status: $POSTS_STATUS"
    fi
else
    echo "❌ REST API still not accessible. Status: $API_STATUS"
fi

# Clean up
rm -f /tmp/wp-cookies.txt

echo "WordPress configuration completed!"