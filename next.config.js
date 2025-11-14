/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  experimental: {
    appDir: true,
  },
=======
>>>>>>> 64406f1d72c806faff9755f9f93db2a79475480c
  images: {
    domains: ['mitrabantennews.com', 'www.mitrabantennews.com'],
  },
  env: {
    WORDPRESS_URL: process.env.WORDPRESS_URL,
    WORDPRESS_API_URL: process.env.WORDPRESS_API_URL,
  },
}

module.exports = nextConfig