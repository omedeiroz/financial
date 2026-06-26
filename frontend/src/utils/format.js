export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

export function formatNumber(value, decimals = 1) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value) || 0);
}

const PT_MONTHS = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];
const PT_WEEKDAYS = ['dom','seg','ter','qua','qui','sex','sáb'];
const PT_WEEKDAYS_LONG = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];

export function formatMonth(dateStr) {
  const [year, month] = dateStr.split('-');
  return `${PT_MONTHS[parseInt(month, 10) - 1]} ${year}`;
}

export function formatMonthCapitalized(dateStr) {
  const f = formatMonth(dateStr);
  return f.charAt(0).toUpperCase() + f.slice(1);
}

export function formatDayLabel(date) {
  return PT_WEEKDAYS[date.getDay()].toUpperCase();
}

export function formatDayLong(date) {
  return PT_WEEKDAYS_LONG[date.getDay()];
}

export function formatDateEyebrow(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monthAbbr = PT_MONTHS[month - 1].slice(0, 3).toUpperCase();
  const weekday = PT_WEEKDAYS_LONG[date.getDay()];
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${String(day).padStart(2, '0')} ${monthAbbr} ${year} · ${weekdayCap}`;
}

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toMonthStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatCurrencyShort(value) {
  const n = Number(value) || 0;
  if (n >= 1000) return 'R$ ' + (n / 1000).toFixed(1).replace('.', ',') + 'k';
  return 'R$ ' + Math.round(n).toLocaleString('pt-BR');
}

export function calcFinalValue({ route_value, has_backup, backup_value, gnv_cost, gasoline_cost }) {
  const base = Number(route_value) + (has_backup ? Number(backup_value) : 0);
  return (base * 0.875) - Number(gnv_cost) - Number(gasoline_cost);
}
