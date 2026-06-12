/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 1,
    webpackBuildWorker: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
