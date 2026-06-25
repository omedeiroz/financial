import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDailySummary } from '../../hooks/useSummary';
import { formatCurrency, formatNumber, formatMonthCapitalized, toMonthStr, toDateStr } from '../../utils/format';
import BottomNav from '../../components/BottomNav/BottomNav';
import styles from './MonthHistory.module.css';

const PT_WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const PT_MONTHS_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function addMonths(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthStr(d);
}

function dayNum(dayStr) {
  return Number(String(dayStr).slice(8, 10));
}

function quinzenaSummary(days, q) {
  const filtered = days.filter(d => q === 1 ? dayNum(d.day) <= 15 : dayNum(d.day) > 15);
  return {
    total_liquid: filtered.reduce((s, d) => s + Number(d.total_liquid), 0),
    total_routes: filtered.reduce((s, d) => s + Number(d.total_routes), 0),
    total_km:     filtered.reduce((s, d) => s + Number(d.total_km), 0),
    total_fuel:   filtered.reduce((s, d) => s + Number(d.total_fuel || 0), 0),
  };
}

export default function MonthHistory() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(toMonthStr(new Date()));
  const [activeQ, setActiveQ] = useState(0); // 0=ambas, 1=1ª, 2=2ª
  const today = toDateStr(new Date());

  const { data: days = [], isLoading, isError, refetch } = useDailySummary(month);

  const q1 = quinzenaSummary(days, 1);
  const q2 = quinzenaSummary(days, 2);

  const visibleDays = activeQ === 0 ? days
    : activeQ === 1 ? days.filter(d => dayNum(d.day) <= 15)
    : days.filter(d => dayNum(d.day) > 15);

  function formatDayStr(dayStr) {
    try {
      const clean = String(dayStr).slice(0, 10);
      const [y, m, d] = clean.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const weekday = PT_WEEKDAYS[date.getDay()] ?? 'Seg';
      const monthAbbr = PT_MONTHS_ABBR[m - 1] ?? '';
      return { weekday, day: d, month: monthAbbr, isToday: clean === today };
    } catch {
      return { weekday: '—', day: 0, month: '', isToday: false };
    }
  }

  function handleMonthChange(delta) {
    setMonth(m => addMonths(m, delta));
    setActiveQ(0);
  }

  function toggleQ(q) {
    setActiveQ(prev => prev === q ? 0 : q);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ChevronLeft size={15} strokeWidth={1.8} color="var(--ink-2)" />
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.eyebrow}>HISTÓRICO</span>
          <div className={styles.monthNav}>
            <button className={styles.chevron} onClick={() => handleMonthChange(-1)}>
              <ChevronLeft size={14} strokeWidth={1.8} />
            </button>
            <span className={styles.monthLabel}>{formatMonthCapitalized(month)}</span>
            <button className={styles.chevron} onClick={() => handleMonthChange(1)}>
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div className={styles.quinzenaCards}>
        <button
          className={`${styles.summaryCard} ${activeQ === 1 ? styles.summaryCardActive : ''}`}
          onClick={() => toggleQ(1)}
        >
          <span className={styles.summaryEyebrow}>1ª QUINZENA · 1–15</span>
          <span className={styles.summaryValue}>{formatCurrency(q1.total_liquid)}</span>
          <div className={styles.summaryStats}>
            <div className={styles.summaryStat}>
              <span className={styles.summaryStatNum}>{q1.total_routes}</span>
              <span className={styles.summaryStatLabel}>ROTAS</span>
            </div>
            <div className={`${styles.summaryStat} ${styles.summaryStatBorder}`}>
              <span className={styles.summaryStatNum}>{formatNumber(q1.total_km, 0)}</span>
              <span className={styles.summaryStatLabel}>KM</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.summaryStatNum}>{formatCurrency(q1.total_fuel)}</span>
              <span className={styles.summaryStatLabel}>COMBUST.</span>
            </div>
          </div>
        </button>

        <button
          className={`${styles.summaryCard} ${activeQ === 2 ? styles.summaryCardActive : ''}`}
          onClick={() => toggleQ(2)}
        >
          <span className={styles.summaryEyebrow}>2ª QUINZENA · 16–30</span>
          <span className={styles.summaryValue}>{formatCurrency(q2.total_liquid)}</span>
          <div className={styles.summaryStats}>
            <div className={styles.summaryStat}>
              <span className={styles.summaryStatNum}>{q2.total_routes}</span>
              <span className={styles.summaryStatLabel}>ROTAS</span>
            </div>
            <div className={`${styles.summaryStat} ${styles.summaryStatBorder}`}>
              <span className={styles.summaryStatNum}>{formatNumber(q2.total_km, 0)}</span>
              <span className={styles.summaryStatLabel}>KM</span>
            </div>
            <div className={styles.summaryStat}>
              <span className={styles.summaryStatNum}>{formatCurrency(q2.total_fuel)}</span>
              <span className={styles.summaryStatLabel}>COMBUST.</span>
            </div>
          </div>
        </button>
      </div>

      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>
          {activeQ === 0 ? 'DIAS DO MÊS' : activeQ === 1 ? '1ª QUINZENA · DIAS' : '2ª QUINZENA · DIAS'}
        </span>
        {!isLoading && !isError && (
          <span className={styles.sectionCount}>{visibleDays.length} com rotas</span>
        )}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.feedback}>
            <div className={styles.spinner} />
            <span>Carregando...</span>
          </div>
        ) : isError ? (
          <div className={styles.feedback}>
            <span className={styles.errorMsg}>Erro ao carregar dados.</span>
            <button className={styles.retryBtn} onClick={() => refetch()}>
              Tentar novamente
            </button>
          </div>
        ) : visibleDays.length === 0 ? (
          <div className={styles.empty}>Nenhuma rota neste período</div>
        ) : (
          visibleDays.map((day) => {
            const { weekday, day: dayN, month: monthAbbr, isToday } = formatDayStr(day.day);
            return (
              <div
                key={day.day}
                className={styles.dayRow}
                onClick={() => navigate(`/?date=${String(day.day).slice(0, 10)}`)}
              >
                <div className={`${styles.dateBadge} ${isToday ? styles.dateBadgeToday : ''}`}>
                  <span className={styles.badgeLabel}>{weekday.toUpperCase()}</span>
                  <span className={styles.badgeNum}>{dayN}</span>
                </div>
                <div className={styles.dayContent}>
                  <div className={styles.dayNameRow}>
                    <span className={styles.dayName}>{weekday}-feira, {dayN} {monthAbbr}</span>
                    {isToday && <span className={styles.todayBadge}>hoje</span>}
                  </div>
                  <span className={styles.dayDetail}>
                    {day.total_routes} {day.total_routes === 1 ? 'rota' : 'rotas'} · {formatNumber(day.total_km, 0)} km
                  </span>
                </div>
                <span className={styles.dayValue}>{formatCurrency(day.total_liquid)}</span>
                <ChevronRight size={12} strokeWidth={1.8} color="var(--ink-4)" />
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
