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
      // Google Search Console HTML verification.
      //
      // Google insists the file sits at the site root, but the token is stored in
      // the database so the owner can change it from /admin/settings without a
      // rebuild. The pattern is deliberately narrow — only google<token>.html is
      // rewritten, so every other unknown path still 404s normally. A catch-all
      // route would have swallowed them.
      {
        source: '/:token(google[a-z0-9]{8,40}\\.html)',
        destination: 'http://localhost:5000/api/public/seo/gsc/:token',
      },
    ];
  },
};

module.exports = nextConfig;
