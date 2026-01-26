/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    // Use localhost for local dev, Docker container name for production
    const apiHost = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : 'http://chonkie:8000';

    return [
      {
        source: '/api/chunk',
        destination: `${apiHost}/chunk`,
      },
    ]
  },
};

module.exports = nextConfig;