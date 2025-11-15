#!/bin/bash

# WordPress Security Cleanup Script
# Removes default plugins and themes for security hardening

echo "🔒 WordPress Security Cleanup - Removing default plugins and themes..."

# Define paths
WP_CONTENT_DIR="$(dirname "$0")/wp-content"
PLUGINS_DIR="$WP_CONTENT_DIR/plugins"
THEMES_DIR="$WP_CONTENT_DIR/themes"

# Remove default plugins
echo "🗑️  Removing default plugins..."
if [ -d "$PLUGINS_DIR/akismet" ]; then
    rm -rf "$PLUGINS_DIR/akismet"
    echo "   ✅ Removed akismet plugin"
fi

if [ -f "$PLUGINS_DIR/hello.php" ]; then
    rm -f "$PLUGINS_DIR/hello.php"
    echo "   ✅ Removed hello.php plugin"
fi

# Remove default themes
echo "🗑️  Removing default themes..."
for theme in twentytwentythree twentytwentyfour twentytwentyfive; do
    if [ -d "$THEMES_DIR/$theme" ]; then
        rm -rf "$THEMES_DIR/$theme"
        echo "   ✅ Removed $theme theme"
    fi
done

# Ensure index.php files exist for security
echo "🔐 Ensuring security index files..."
if [ ! -f "$PLUGINS_DIR/index.php" ]; then
    echo "<?php // Silence is golden ?>" > "$PLUGINS_DIR/index.php"
    echo "   ✅ Created plugins/index.php"
fi

if [ ! -f "$THEMES_DIR/index.php" ]; then
    echo "<?php // Silence is golden ?>" > "$THEMES_DIR/index.php"
    echo "   ✅ Created themes/index.php"
fi

echo "✅ Security cleanup completed successfully!"
echo "📊 Summary:"
echo "   - Default plugins removed"
echo "   - Default themes removed" 
echo "   - Security index files ensured"
echo "   - Attack surface reduced"