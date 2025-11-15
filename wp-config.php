<?php
/**
 * WordPress configuration file for HeadlessWP
 */

// ** Database settings ** //
define('DB_NAME', 'wordpress');
define('DB_USER', 'wordpress');
define('DB_PASSWORD', 'wordpress');
define('DB_HOST', 'db');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// ** WordPress debugging ** //
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', true);

// ** Authentication Unique Keys and Salts ** //
define('AUTH_KEY',         getenv('WP_AUTH_KEY') ?: 'generate-secure-key-here');
define('SECURE_AUTH_KEY',  getenv('WP_SECURE_AUTH_KEY') ?: 'generate-secure-key-here');
define('LOGGED_IN_KEY',    getenv('WP_LOGGED_IN_KEY') ?: 'generate-secure-key-here');
define('NONCE_KEY',        getenv('WP_NONCE_KEY') ?: 'generate-secure-key-here');
define('AUTH_SALT',        getenv('WP_AUTH_SALT') ?: 'generate-secure-key-here');
define('SECURE_AUTH_SALT', getenv('WP_SECURE_AUTH_SALT') ?: 'generate-secure-key-here');
define('LOGGED_IN_SALT',   getenv('WP_LOGGED_IN_SALT') ?: 'generate-secure-key-here');
define('NONCE_SALT',       getenv('WP_NONCE_SALT') ?: 'generate-secure-key-here');

// ** Security hardening ** //
define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', true);
define('AUTOMATIC_UPDATER_DISABLED', false);
define('WP_AUTO_UPDATE_CORE', true);
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

// ** Disable theme and plugin installation/updates ** //
define('FS_METHOD', 'direct');
define('WP_CONTENT_URL', '/wp-content');

// ** WordPress absolute path ** //
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

// ** Load WordPress ** //
require_once ABSPATH . 'wp-settings.php';