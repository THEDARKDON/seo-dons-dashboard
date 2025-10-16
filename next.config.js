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
  // Disable output file tracing to prevent manifest errors
  outputFileTracing: false,
}

module.exports = nextConfig
