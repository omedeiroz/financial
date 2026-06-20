import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/routes';
import BottomNav from '../../components/BottomNav/BottomNav';
import { formatCurrency, formatNumber, formatMonthCapitalized, toMonthStr, toDateStr } from '../../utils/format';
import styles from './RoutesList.module.css';

const PT_MONTHS_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function addMonths(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthStr(d);
}

function formatDayBadge(dayStr) {
  const [, m, d] = dayStr.split('-').map(Number);
  return `${d} ${PT_MONTHS_ABBR[m - 1]}`;
}

export default function RoutesList() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(toMonthStr(new Date()));

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes', 'month', month],
    queryFn: () => api.getByMonth(month),
    enabled: !!month,
  });

  const totalLiquid = routes.reduce((s, r) => s + Number(r.final_value), 0);

  // Group routes by day
  const grouped = routes.reduce((acc, r) => {
    if (!acc[r.day]) acc[r.day] = [];
    acc[r.day].push(r);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.monthNav}>
          <button className={styles.chevron} onClick={() => setMonth(m => addMonths(m, -1))}>
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <div className={styles.headerCenter}>
            <span className={styles.eyebrow}>ROTAS</span>
            <span className={styles.monthLabel}>{formatMonthCapitalized(month)}</span>
          </div>
          <button className={styles.chevron} onClick={() => setMonth(m => addMonths(m, 1))}>
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className={styles.totalPill}>
          <span className={styles.totalLabel}>LÍQUIDO</span>
          <span className={styles.totalValue}>{formatCurrency(totalLiquid)}</span>
        </div>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.empty}>Carregando...</div>
        ) : routes.length === 0 ? (
          <div className={styles.empty}>Nenhuma rota neste mês</div>
        ) : (
          days.map(day => (
            <div key={day}>
              <div className={styles.dayHeader}>
                <span className={styles.dayLabel}>{formatDayBadge(day)}</span>
                <span className={styles.dayTotal}>
                  {formatCurrency(grouped[day].reduce((s, r) => s + Number(r.final_value), 0))}
                </span>
              </div>
              {grouped[day].map(route => (
                <div
                  key={route.id}
                  className={styles.row}
                  onClick={() => navigate(`/routes/${route.id}`)}
                >
                  <div className={styles.bar} />
                  <div className={styles.content}>
                    <div className={styles.nameRow}>
                      <span className={styles.name}>{route.name}</span>
                      {route.has_backup && <span className={styles.badge}>backup</span>}
                    </div>
                    <span className={styles.detail}>
                      {formatNumber(route.km_route, 0)} km
                      {Number(route.gnv_cost) > 0 ? ` · GNV ${formatCurrency(route.gnv_cost)}` : ''}
                      {Number(route.gasoline_cost) > 0 ? ` · Gas. ${formatCurrency(route.gasoline_cost)}` : ''}
                    </span>
                  </div>
                  <span className={styles.value}>{formatCurrency(route.final_value)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
