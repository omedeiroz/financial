const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // necessário para Neon
});

// Testa a conexão ao iniciar
pool.query('SELECT 1').then(() =>
  console.log('✓ Conectado ao banco Neon')
).catch(err =>
  console.error('✗ Erro na conexão com o banco:', err.message)
);

module.exports = pool;
