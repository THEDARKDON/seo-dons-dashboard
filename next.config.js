/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.clerk.dev', 'www.gravatar.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Fix for Netlify deployment - ensure proper output configuration
  output: 'standalone',
  outputFileTracingIncludes: {
    '/*': ['./node_modules/**/*'],
  },
}

module.exports = nextConfig
