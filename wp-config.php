<?php
/**
 * WordPress configuration file for HeadlessWP
 */

// ** Database settings ** //
define('DB_NAME', getenv('MYSQL_DATABASE') ?: 'wordpress');
define('DB_USER', getenv('MYSQL_USER') ?: 'wordpress');
define('DB_PASSWORD', getenv('MYSQL_PASSWORD') ?: 'wordpress');
define('DB_HOST', getenv('WORDPRESS_DB_HOST') ?: 'db');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// ** WordPress debugging ** //
define('WP_DEBUG', (getenv('WP_DEBUG') ?: 'false') === 'true');
define('WP_DEBUG_LOG', (getenv('WP_DEBUG_LOG') ?: 'false') === 'true');
define('WP_DEBUG_DISPLAY', (getenv('WP_DEBUG_DISPLAY') ?: 'false') === 'true');

// ** Authentication Unique Keys and Salts ** //
// WARNING: Generate secure keys for production!
// Use: https://api.wordpress.org/secret-key/1.1/salt/
// Set WP_AUTH_KEY, WP_SECURE_AUTH_KEY, etc. in .env file
define('AUTH_KEY',         getenv('WP_AUTH_KEY') ?: 'development-only-do-not-use-in-production');
define('SECURE_AUTH_KEY',  getenv('WP_SECURE_AUTH_KEY') ?: 'development-only-do-not-use-in-production');
define('LOGGED_IN_KEY',    getenv('WP_LOGGED_IN_KEY') ?: 'development-only-do-not-use-in-production');
define('NONCE_KEY',        getenv('WP_NONCE_KEY') ?: 'development-only-do-not-use-in-production');
define('AUTH_SALT',        getenv('WP_AUTH_SALT') ?: 'development-only-do-not-use-in-production');
define('SECURE_AUTH_SALT', getenv('WP_SECURE_AUTH_SALT') ?: 'development-only-do-not-use-in-production');
define('LOGGED_IN_SALT',   getenv('WP_LOGGED_IN_SALT') ?: 'development-only-do-not-use-in-production');
define('NONCE_SALT',       getenv('WP_NONCE_SALT') ?: 'development-only-do-not-use-in-production');

// ** WordPress absolute path ** //
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

// ** Load WordPress ** //
require_once ABSPATH . 'wp-settings.php';