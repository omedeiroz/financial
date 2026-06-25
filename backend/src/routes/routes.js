const express = require('express');
const router  = express.Router();
const db      = require('../db');

// ─────────────────────────────────────────────────────────────
// GET /api/routes?date=2026-05-22
//   → rotas de um dia específico
//
// GET /api/routes?month=2026-05
//   → todas as rotas do mês
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { date, month } = req.query;

    if (date) {
      const { rows } = await db.query(
        `SELECT * FROM routes WHERE day = $1 ORDER BY created_at`,
        [date]
      );
      return res.json(rows);
    }

    if (month) {
      const { rows } = await db.query(
        `SELECT * FROM routes
         WHERE TO_CHAR(day, 'YYYY-MM') = $1
         ORDER BY day DESC, created_at`,
        [month]
      );
      return res.json(rows);
    }

    res.status(400).json({ error: 'Informe date (YYYY-MM-DD) ou month (YYYY-MM)' });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/routes/monthly-summary?month=2026-05
//   → totais do mês: líquido, km, rotas, combustível
// ─────────────────────────────────────────────────────────────
router.get('/monthly-summary', async (req, res, next) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Parâmetro month obrigatório (YYYY-MM)' });

    const { rows } = await db.query(
      `SELECT
         COUNT(*)::int                              AS total_routes,
         COALESCE(SUM(km_route),    0)::float       AS total_km,
         COALESCE(SUM(final_value), 0)::float       AS total_liquid,
         COALESCE(SUM(route_value), 0)::float       AS total_gross,
         COALESCE(SUM(gnv_cost + gasoline_cost), 0)::float AS total_fuel
       FROM routes
       WHERE TO_CHAR(day, 'YYYY-MM') = $1`,
      [month]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/routes/daily-summary?month=2026-05
//   → totais por dia (para tela de histórico mensal)
// ─────────────────────────────────────────────────────────────
router.get('/daily-summary', async (req, res, next) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Parâmetro month obrigatório (YYYY-MM)' });

    const { rows } = await db.query(
      `SELECT
         day,
         COUNT(*)::int                              AS total_routes,
         COALESCE(SUM(km_route),    0)::float       AS total_km,
         COALESCE(SUM(final_value), 0)::float       AS total_liquid,
         COALESCE(SUM(gnv_cost + gasoline_cost), 0)::float AS total_fuel
       FROM routes
       WHERE TO_CHAR(day, 'YYYY-MM') = $1
       GROUP BY day
       ORDER BY day DESC`,
      [month]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/routes/yearly-summary?year=2026
//   → totais por mês do ano (para gráfico anual)
// ─────────────────────────────────────────────────────────────
router.get('/yearly-summary', async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'Parâmetro year obrigatório (YYYY)' });

    const { rows } = await db.query(
      `SELECT
         TO_CHAR(day, 'YYYY-MM')                    AS month,
         COUNT(*)::int                              AS total_routes,
         COALESCE(SUM(km_route),    0)::float       AS total_km,
         COALESCE(SUM(final_value), 0)::float       AS total_liquid,
         COALESCE(SUM(gnv_cost + gasoline_cost), 0)::float AS total_fuel
       FROM routes
       WHERE EXTRACT(YEAR FROM day) = $1
       GROUP BY TO_CHAR(day, 'YYYY-MM')
       ORDER BY month`,
      [year]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/routes/alltime-summary
//   → totais de todos os tempos
// ─────────────────────────────────────────────────────────────
router.get('/alltime-summary', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*)::int                              AS total_routes,
         COALESCE(SUM(km_route),    0)::float       AS total_km,
         COALESCE(SUM(final_value), 0)::float       AS total_liquid,
         COALESCE(SUM(gnv_cost + gasoline_cost), 0)::float AS total_fuel,
         MIN(day)                                   AS first_day,
         MAX(day)                                   AS last_day
       FROM routes`
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/routes/:id
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM routes WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rota não encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/routes
// Body: { day, name, km_initial, km_final, route_value,
//         has_backup, backup_value, gnv_cost, gasoline_cost }
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      day, name, km_initial, km_final, route_value,
      has_backup   = false,
      backup_value = 0,
      gnv_cost     = 0,
      gasoline_cost = 0,
    } = req.body;

    // Validação básica
    if (!day || !name || km_initial == null || km_final == null || route_value == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: day, name, km_initial, km_final, route_value' });
    }
    if (km_final < km_initial) {
      return res.status(400).json({ error: 'km_final não pode ser menor que km_initial' });
    }

    const { rows } = await db.query(
      `INSERT INTO routes
         (day, name, km_initial, km_final, route_value, has_backup, backup_value, gnv_cost, gasoline_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [day, name, km_initial, km_final, route_value, has_backup, backup_value, gnv_cost, gasoline_cost]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/routes/:id
// ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const {
      day, name, km_initial, km_final, route_value,
      has_backup    = false,
      backup_value  = 0,
      gnv_cost      = 0,
      gasoline_cost = 0,
    } = req.body;

    if (km_final < km_initial) {
      return res.status(400).json({ error: 'km_final não pode ser menor que km_initial' });
    }

    const { rows } = await db.query(
      `UPDATE routes
       SET day=$1, name=$2, km_initial=$3, km_final=$4, route_value=$5,
           has_backup=$6, backup_value=$7, gnv_cost=$8, gasoline_cost=$9,
           updated_at=NOW()
       WHERE id=$10
       RETURNING *`,
      [day, name, km_initial, km_final, route_value, has_backup, backup_value, gnv_cost, gasoline_cost, req.params.id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Rota não encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/routes/:id
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `DELETE FROM routes WHERE id=$1 RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rota não encontrada' });
    res.json({ deleted: rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
