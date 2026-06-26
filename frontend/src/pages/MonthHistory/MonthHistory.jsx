import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthlySummary, useDailySummary } from '../../hooks/useSummary';
import {
  formatCurrency, formatCurrencyShort, formatNumber,
  formatMonthCapitalized, toMonthStr, toDateStr,
} from '../../utils/format';
import BottomNav from '../../components/BottomNav/BottomNav';
import styles from './MonthHistory.module.css';

const PT_WEEKDAYS     = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const PT_MONTHS_ABBR  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const PT_MONTHS_SHORT = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

function addMonths(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number);
  return toMonthStr(new Date(y, m - 1 + delta, 1));
}

function dayNumOf(dayStr) {
  return Number(String(dayStr).slice(8, 10));
}

function quinzenaSummary(days, q) {
  const list = days.filter(d => q === 1 ? dayNumOf(d.day) <= 15 : dayNumOf(d.day) > 15);
  return {
    total_liquid: list.reduce((s, d) => s + Number(d.total_liquid), 0),
    total_routes: list.reduce((s, d) => s + Number(d.total_routes), 0),
    total_km:     list.reduce((s, d) => s + Number(d.total_km),     0),
  };
}

export default function MonthHistory() {
  const navigate  = useNavigate();
  const [month, setMonth]   = useState(toMonthStr(new Date()));
  const [activeQ, setActiveQ] = useState(0); // 0=all, 1=1ª, 2=2ª
  const today = toDateStr(new Date());

  const { data: summary }   = useMonthlySummary(month);
  const { data: prevSummary } = useMonthlySummary(addMonths(month, -1));
  const { data: days = [], isLoading, isError, refetch } = useDailySummary(month);

  // ── Hero delta ─────────────────────────────────────────────
  const currTotal = Number(summary?.total_liquid || 0);
  const prevTotal = Number(prevSummary?.total_liquid || 0);
  const delta     = currTotal - prevTotal;
  const deltaPct  = prevTotal > 0 ? Math.abs(Math.round((delta / prevTotal) * 100)) : null;
  const prevMonthIdx = parseInt(addMonths(month, -1).split('-')[1], 10) - 1;
  const prevMonthShort = PT_MONTHS_SHORT[prevMonthIdx];

  // ── Quinzena summaries ─────────────────────────────────────
  const q1 = quinzenaSummary(days, 1);
  const q2 = quinzenaSummary(days, 2);
  const maxQ = Math.max(q1.total_liquid, q2.total_liquid, 1);

  // ── Visible days ───────────────────────────────────────────
  const visibleDays = activeQ === 0 ? days
    : activeQ === 1 ? days.filter(d => dayNumOf(d.day) <= 15)
    : days.filter(d => dayNumOf(d.day) > 15);

  const maxLiquid = Math.max(...visibleDays.map(d => Number(d.total_liquid)), 1);

  // ── Helpers ────────────────────────────────────────────────
  function parseDayRow(dayStr) {
    try {
      const clean = String(dayStr).slice(0, 10);
      const [y, m, d] = clean.split('-').map(Number);
      const date    = new Date(y, m - 1, d);
      return {
        weekday:   PT_WEEKDAYS[date.getDay()],
        dayN:      d,
        monthAbbr: PT_MONTHS_ABBR[m - 1],
        isToday:   clean === today,
      };
    } catch {
      return { weekday: '—', dayN: 0, monthAbbr: '', isToday: false };
    }
  }

  function handleMonthChange(delta) {
    setMonth(m => addMonths(m, delta));
    setActiveQ(0);
  }

  const sectionLabel =
    activeQ === 1 ? '1ª QUINZENA · DIAS' :
    activeQ === 2 ? '2ª QUINZENA · DIAS' : 'DIAS DO MÊS';

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
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
        <div style={{ width: 32, height: 32 }} />
      </div>

      {/* ── Hero ── */}
      <div className={styles.hero} key={month}>
        <span className={styles.heroEyebrow}>VALOR LÍQUIDO DO MÊS</span>
        <div className={styles.heroRow}>
          <span className={styles.heroValue}>{formatCurrency(currTotal)}</span>
          {deltaPct !== null && (
            <div className={styles.heroDelta}>
              <span
                className={styles.heroDeltaNum}
                style={{ color: delta >= 0 ? 'var(--ok)' : 'var(--danger)' }}
              >
                {delta >= 0 ? '↑' : '↓'} {deltaPct}%
              </span>
              <span className={styles.heroDeltaLabel}>VS {prevMonthShort}</span>
            </div>
          )}
        </div>
        <div className={styles.statsStrip}>
          <div className={`${styles.statCol} ${styles.statColBorder}`}>
            <span className={styles.statNum}>{summary?.total_routes || 0}</span>
            <span className={styles.statLabel}>ROTAS</span>
          </div>
          <div className={`${styles.statCol} ${styles.statColBorder}`}>
            <span className={styles.statNum}>{formatNumber(summary?.total_km || 0, 0)}</span>
            <span className={styles.statLabel}>KM</span>
          </div>
          <div className={styles.statCol}>
            <span className={`${styles.statNum} ${styles.statNumDanger}`}>
              {formatCurrencyShort(summary?.total_fuel || 0)}
            </span>
            <span className={styles.statLabel}>COMBUST.</span>
          </div>
        </div>
      </div>

      {/* ── Quinzena Cards ── */}
      <div className={styles.quinzenaCards}>
        {[1, 2].map(q => {
          const qd  = q === 1 ? q1 : q2;
          const pct = Math.round((qd.total_liquid / maxQ) * 100);
          return (
            <button
              key={q}
              className={`${styles.qCard} ${activeQ === q ? styles.qCardActive : ''}`}
              onClick={() => setActiveQ(prev => prev === q ? 0 : q)}
            >
              <span className={styles.qEyebrow}>{q === 1 ? '1ª QUINZENA' : '2ª QUINZENA'}</span>
              <span className={styles.qValue}>{formatCurrencyShort(qd.total_liquid)}</span>
              <div className={styles.qBar}>
                <div className={styles.qBarFill} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.qStats}>
                <div className={styles.qStat}>
                  <span className={styles.qStatNum}>{qd.total_routes}</span>
                  <span className={styles.qStatLabel}>ROTAS</span>
                </div>
                <div className={`${styles.qStat} ${styles.qStatBorder}`}>
                  <span className={styles.qStatNum}>{formatNumber(qd.total_km, 0)}</span>
                  <span className={styles.qStatLabel}>KM</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Section Header ── */}
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>{sectionLabel}</span>
        {!isLoading && !isError && (
          <span className={styles.sectionCount}>{visibleDays.length} dias</span>
        )}
      </div>

      {/* ── Day List ── */}
      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.feedback}>
            <div className={styles.spinner} />
            <span>Carregando...</span>
          </div>
        ) : isError ? (
          <div className={styles.feedback}>
            <span className={styles.errorMsg}>Erro ao carregar dados.</span>
            <button className={styles.retryBtn} onClick={() => refetch()}>Tentar novamente</button>
          </div>
        ) : visibleDays.length === 0 ? (
          <div className={styles.empty}>Nenhuma rota neste período</div>
        ) : (
          visibleDays.map(day => {
            const { weekday, dayN, monthAbbr, isToday } = parseDayRow(day.day);
            const barPct = Math.round((Number(day.total_liquid) / maxLiquid) * 100);
            return (
              <div
                key={day.day}
                className={styles.dayRow}
                onClick={() => navigate(`/?date=${String(day.day).slice(0, 10)}`)}
              >
                <div className={`${styles.dateBadge} ${isToday ? styles.dateBadgeToday : ''}`}>
                  <span className={`${styles.badgeWeekday} ${isToday ? styles.badgeWeekdayToday : ''}`}>
                    {weekday.toUpperCase()}
                  </span>
                  <span className={`${styles.badgeNum} ${isToday ? styles.badgeNumToday : ''}`}>
                    {dayN}
                  </span>
                </div>

                <div className={styles.dayContent}>
                  <div className={styles.dayNameRow}>
                    <span className={styles.dayName}>{weekday}-feira, {dayN} {monthAbbr}</span>
                    {isToday && <span className={styles.todayBadge}>hoje</span>}
                  </div>
                  <div className={styles.dayBarRow}>
                    <div className={styles.microBar}>
                      <div className={styles.microBarFill} style={{ width: `${barPct}%` }} />
                    </div>
                    <span className={styles.dayDetail}>
                      {day.total_routes} {Number(day.total_routes) === 1 ? 'rota' : 'rotas'} · {formatNumber(day.total_km, 0)} km
                    </span>
                  </div>
                </div>

                <span className={styles.dayValue}>{formatCurrencyShort(day.total_liquid)}</span>
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
