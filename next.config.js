/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

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
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Run manifest fix after build completes
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('FixManifests', () => {
            try {
              execSync('node fix-manifests.js', { stdio: 'inherit' });
            } catch (err) {
              console.warn('Manifest fix warning:', err.message);
            }
          });
        },
      });
    }
    return config;
  },
}

module.exports = nextConfig
