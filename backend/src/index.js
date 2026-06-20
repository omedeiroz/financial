require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const routesRouter = require('./routes/routes');
const errorHandler = require('./middleware/error');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// ── Rotas ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/routes', routesRouter);

// ── Erro global ──────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () =>
  console.log(`✓ Servidor rodando em http://localhost:${PORT}`)
);
