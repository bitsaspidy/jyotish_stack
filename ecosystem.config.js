module.exports = {
  apps: [
    {
      name: 'jyotish-server',
      script: './server/src/index.js',
      cwd: '/var/www/jyotish-stack',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'jyotish-ui',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/jyotish-stack/ui-main',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
