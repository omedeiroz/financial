import { useEffect } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const INTERVAL = 9 * 60 * 1000; // 9 minutos

export function useKeepAlive() {
  useEffect(() => {
    const ping = () => fetch(`${BASE}/health`, { method: 'GET' }).catch(() => {});
    ping(); // ping imediato ao abrir o app
    const id = setInterval(ping, INTERVAL);
    return () => clearInterval(id);
  }, []);
}
