const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000); // 20s timeout para o Render acordar
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return handleResponse(res);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Servidor demorou para responder. Tente novamente.');
    }
    if (err.name === 'TypeError') {
      throw new Error('Sem conexão com o servidor.');
    }
    throw err;
  }
}

export const api = {
  getByDate: (date) =>
    apiFetch(`${BASE}/api/routes?date=${date}`),

  getByMonth: (month) =>
    apiFetch(`${BASE}/api/routes?month=${month}`),

  getMonthlySummary: (month) =>
    apiFetch(`${BASE}/api/routes/monthly-summary?month=${month}`),

  getDailySummary: (month) =>
    apiFetch(`${BASE}/api/routes/daily-summary?month=${month}`),

  getOne: (id) =>
    apiFetch(`${BASE}/api/routes/${id}`),

  create: (body) =>
    apiFetch(`${BASE}/api/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  update: (id, body) =>
    apiFetch(`${BASE}/api/routes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  delete: (id) =>
    apiFetch(`${BASE}/api/routes/${id}`, { method: 'DELETE' }),

  getYearlySummary: (year) =>
    apiFetch(`${BASE}/api/routes/yearly-summary?year=${year}`),

  getAlltimeSummary: () =>
    apiFetch(`${BASE}/api/routes/alltime-summary`),

  exportMonth: (month) =>
    fetch(`${BASE}/api/routes?month=${month}`).then(r => r.json()),
};
