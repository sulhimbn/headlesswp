/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['mitrabantennews.com', 'www.mitrabantennews.com'],
  },
  env: {
    WORDPRESS_URL: process.env.WORDPRESS_URL,
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
  },
}

module.exports = nextConfig