<?php
/**
 * WPGraphQL Configuration for Headless WordPress
 * 
 * This file contains configuration settings for WPGraphQL plugin
 * to optimize it for headless WordPress setup with Next.js frontend.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enable WPGraphQL public access for headless frontend
 */
add_action('graphql_init', function() {
    // Enable public schema access
    add_filter('graphql_should_enable_public_introspection', '__return_true');
    
    // Enable GraphQL endpoint for non-authenticated users
    add_filter('graphql_is_endpoint_public', '__return_true');
});

/**
 * Configure CORS headers for Next.js frontend
 */
add_action('init', function() {
    // Get frontend URL from environment or default
    $frontend_url = getenv('NEXT_PUBLIC_WORDPRESS_URL') ?: 'http://localhost:3000';
    
    // Add CORS headers for GraphQL endpoint
    add_action('send_headers', function() use ($frontend_url) {
        if (strpos($_SERVER['REQUEST_URI'], '/graphql') !== false) {
            header('Access-Control-Allow-Origin: ' . $frontend_url);
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
            header('Access-Control-Allow-Credentials: true');
        }
    });
});

/**
 * Handle preflight OPTIONS requests for CORS
 */
add_action('init', function() {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS' && strpos($_SERVER['REQUEST_URI'], '/graphql') !== false) {
        status_header(200);
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce');
        header('Access-Control-Max-Age: 86400');
        exit();
    }
});

/**
 * Optimize GraphQL queries for performance
 */
add_filter('graphql_query_max_query_complexity', function() {
    return 1000; // Increase complexity limit for headless use
});

add_filter('graphql_query_max_query_depth', function() {
    return 10; // Reasonable depth limit
});

/**
 * Enable caching for GraphQL queries
 */
add_action('init', function() {
    // Enable GraphQL query caching if caching plugin is available
    if (function_exists('wp_cache_add')) {
        add_filter('graphql_cache_results', '__return_true');
    }
});

/**
 * Configure GraphQL schema for headless WordPress
 */
add_action('graphql_register_types', function() {
    // Add custom fields if needed
    register_graphql_field('Post', 'customField', [
        'type' => 'String',
        'description' => 'Custom field example',
        'resolve' => function($post) {
            return get_post_meta($post->ID, 'custom_field', true);
        }
    ]);
});

/**
 * Security: Disable GraphQL mutations for public access
 * Uncomment below if you want to disable mutations
 */
// add_filter('graphql_should_enable_mutations', '__return_false');

/**
 * Security: Rate limiting for GraphQL endpoint
 */
add_action('graphql_execute', function($query, $variables, $operation) {
    // Simple rate limiting by IP
    $ip = $_SERVER['REMOTE_ADDR'];
    $cache_key = "graphql_rate_limit_{$ip}";
    $count = wp_cache_get($cache_key);
    
    if ($count === false) {
        $count = 0;
    }
    
    if ($count > 100) { // Limit to 100 requests per hour
        throw new GraphQL\Error\UserError('Rate limit exceeded');
    }
    
    wp_cache_set($cache_key, $count + 1, '', 3600); // 1 hour expiry
}, 10, 3);

/**
 * Environment-specific configuration
 */
if (defined('WP_ENV') && WP_ENV === 'production') {
    // Production-specific settings
    add_filter('graphql_debug_enabled', '__return_false');
    add_filter('graphql_should_enable_query_log', '__return_false');
} else {
    // Development-specific settings
    add_filter('graphql_debug_enabled', '__return_true');
    add_filter('graphql_should_enable_query_log', '__return_true');
}