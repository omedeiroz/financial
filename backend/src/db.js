const { Pool, types } = require('pg');

// Retorna DATE como string YYYY-MM-DD, sem converter para Date JS (evita timezone shift)
types.setTypeParser(1082, val => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT 1').then(() =>
  console.log('✓ Conectado ao banco Neon')
).catch(err =>
  console.error('✗ Erro na conexão com o banco:', err.message)
);

module.exports = pool;
