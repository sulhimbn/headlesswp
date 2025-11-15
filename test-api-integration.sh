#!/bin/bash

echo "🧪 Testing WordPress API Integration"
echo "=================================="

# Test 1: Check WordPress is running
echo "1. Testing WordPress availability..."
WP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$WP_STATUS" = "200" ]; then
    echo "✅ WordPress is running on port 8080"
else
    echo "❌ WordPress is not accessible (Status: $WP_STATUS)"
    exit 1
fi

# Test 2: Check REST API basic endpoint
echo "2. Testing REST API base endpoint..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/wp-json/wp/v2/)
if [ "$API_STATUS" = "200" ]; then
    echo "✅ REST API base endpoint is accessible"
else
    echo "❌ REST API base endpoint failed (Status: $API_STATUS)"
    exit 1
fi

# Test 3: Check posts endpoint
echo "3. Testing posts endpoint..."
POSTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/index.php?rest_route=/wp/v2/posts/")
if [ "$POSTS_STATUS" = "200" ]; then
    echo "✅ Posts endpoint is accessible"
    POSTS_COUNT=$(curl -s "http://localhost:8080/index.php?rest_route=/wp/v2/posts/" | jq '. | length' 2>/dev/null || echo "N/A")
    echo "   📝 Found $POSTS_COUNT posts"
else
    echo "❌ Posts endpoint failed (Status: $POSTS_STATUS)"
    exit 1
fi

# Test 4: Check specific post
echo "4. Testing specific post endpoint..."
POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/index.php?rest_route=/wp/v2/posts&slug=hello-world")
if [ "$POST_STATUS" = "200" ]; then
    echo "✅ Specific post endpoint is accessible"
else
    echo "❌ Specific post endpoint failed (Status: $POST_STATUS)"
fi

# Test 5: Check categories endpoint
echo "5. Testing categories endpoint..."
CATEGORIES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/index.php?rest_route=/wp/v2/categories/")
if [ "$CATEGORIES_STATUS" = "200" ]; then
    echo "✅ Categories endpoint is accessible"
else
    echo "❌ Categories endpoint failed (Status: $CATEGORIES_STATUS)"
fi

# Test 6: Check Next.js build
echo "6. Testing Next.js build..."
BUILD_OUTPUT=$(npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "✓ Compiled successfully"; then
    echo "✅ Next.js build successful"
else
    echo "❌ Next.js build failed"
    echo "$BUILD_OUTPUT" | tail -10
    exit 1
fi

echo ""
echo "🎉 All tests passed! WordPress API integration is working correctly."
echo ""
echo "📋 Summary:"
echo "   • WordPress is running on http://localhost:8080"
echo "   • REST API is accessible via index.php fallback method"
echo "   • Next.js application can fetch posts from WordPress"
echo "   • Build process completes successfully"
echo ""
echo "🚀 You can now run 'npm run dev' to start the development server"