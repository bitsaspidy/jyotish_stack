require('dotenv').config();

// Return DATE and DATETIME columns as plain strings ("YYYY-MM-DD", "HH:MM:SS")
// instead of JS Date objects — avoids timezone conversion bugs in the calc engine.
const typeCast = (field, next) => {
  if (field.type === 'DATE')     return field.string();   // "YYYY-MM-DD"
  if (field.type === 'DATETIME') return field.string();   // "YYYY-MM-DD HH:MM:SS"
  return next();
};

const BASE = {
  charset: 'utf8mb4',
  typeCast,
};

module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || 'bitsaspidy',
      database: process.env.DB_NAME     || 'jyotish_stack_ai_db',
      ...BASE,
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './src/migrations', tableName: 'knex_migrations' },
    seeds:      { directory: './src/seeds' },
  },
  production: {
    client: 'mysql2',
    connection: {
      host:     process.env.DB_HOST,
      port:     process.env.DB_PORT,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl:      { rejectUnauthorized: false },
      ...BASE,
    },
    pool: { min: 2, max: 10 },
    migrations: { directory: './src/migrations', tableName: 'knex_migrations' },
    seeds:      { directory: './src/seeds' },
  },
};
