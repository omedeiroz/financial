const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getByDate: (date) =>
    fetch(`${BASE}/api/routes?date=${date}`).then(handleResponse),

  getByMonth: (month) =>
    fetch(`${BASE}/api/routes?month=${month}`).then(handleResponse),

  getMonthlySummary: (month) =>
    fetch(`${BASE}/api/routes/monthly-summary?month=${month}`).then(handleResponse),

  getDailySummary: (month) =>
    fetch(`${BASE}/api/routes/daily-summary?month=${month}`).then(handleResponse),

  getOne: (id) =>
    fetch(`${BASE}/api/routes/${id}`).then(handleResponse),

  create: (body) =>
    fetch(`${BASE}/api/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handleResponse),

  update: (id, body) =>
    fetch(`${BASE}/api/routes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handleResponse),

  delete: (id) =>
    fetch(`${BASE}/api/routes/${id}`, { method: 'DELETE' }).then(handleResponse),
};
