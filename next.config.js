import withBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mitrabantennews.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mitrabantennews.com',
      },
    ],
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
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
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
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}

export default withBundleAnalyzerConfig(nextConfig)