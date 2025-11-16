/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const nextConfig = {
  images: {
    domains: ['mitrabantennews.com', 'www.mitrabantennews.com'],
  },
  env: {
    WORDPRESS_URL: process.env.WORDPRESS_URL,
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mitrabantennews.com https://www.mitrabantennews.com",
              "style-src 'self' 'unsafe-inline' https://mitrabantennews.com https://www.mitrabantennews.com",
              "img-src 'self' data: blob: https://mitrabantennews.com https://www.mitrabantennews.com",
              "font-src 'self' data:",
              "connect-src 'self' https://mitrabantennews.com https://www.mitrabantennews.com",
              "media-src 'self' https://mitrabantennews.com https://www.mitrabantennews.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()'
            ].join(', ')
          }
        ]
      }
    ]
  }
}

const SentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
}

module.exports = withSentryConfig(nextConfig, SentryWebpackPluginOptions)