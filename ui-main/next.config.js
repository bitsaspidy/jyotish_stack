/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production deploys build into a temporary directory and swap it into
  // place only after the build succeeds. Local development keeps `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  experimental: {
    cpus: 1,
    webpackBuildWorker: false,
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/logo-icon.svg',
        permanent: true,
      },
    ];
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
