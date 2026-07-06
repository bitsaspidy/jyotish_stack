const appDir = process.env.APP_DIR || '/var/www/jyotish-stack';
const apiInstances = Number(process.env.API_INSTANCES || 1);
const uiInstances = Number(process.env.UI_INSTANCES || 1);

module.exports = {
  apps: [
    {
      name: 'jyotish-api',
      script: 'src/index.js',
      cwd: `${appDir}/server`,
      instances: apiInstances,
      exec_mode: apiInstances > 1 ? 'cluster' : 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1024M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
    {
      name: 'jyotish-question-nlp',
      script: `${appDir}/question-service/.venv/bin/uvicorn`,
      args: 'app:app --host 127.0.0.1 --port 5100',
      cwd: `${appDir}/question-service`,
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        PYTHONUNBUFFERED: '1',
      },
    },
    {
      name: 'jyotish-ui-main',
      script: '../node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: `${appDir}/ui-main`,
      instances: uiInstances,
      exec_mode: uiInstances > 1 ? 'cluster' : 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1024M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
