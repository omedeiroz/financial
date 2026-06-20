import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthlySummary, useDailySummary } from '../../hooks/useSummary';
import { formatCurrency, formatNumber, formatMonthCapitalized, toMonthStr, toDateStr } from '../../utils/format';
import styles from './MonthHistory.module.css';

const PT_WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const PT_MONTHS_ABBR = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function addMonths(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthStr(d);
}

function todayStr() {
  return toDateStr(new Date());
}

export default function MonthHistory() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(toMonthStr(new Date()));

  const { data: summary } = useMonthlySummary(month);
  const { data: days = [] } = useDailySummary(month);

  const today = todayStr();

  function formatDayStr(dayStr) {
    const [y, m, d] = dayStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = PT_WEEKDAYS[date.getDay()];
    const monthAbbr = PT_MONTHS_ABBR[m - 1];
    return { weekday, day: d, month: monthAbbr, isToday: dayStr === today };
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
            <button className={styles.chevron} onClick={() => setMonth(m => addMonths(m, -1))}>
              <ChevronLeft size={14} strokeWidth={1.8} />
            </button>
            <span className={styles.monthLabel}>{formatMonthCapitalized(month)}</span>
            <button className={styles.chevron} onClick={() => setMonth(m => addMonths(m, 1))}>
              <ChevronRight size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div className={styles.summaryCard}>
        <span className={styles.summaryEyebrow}>VALOR LÍQUIDO · {formatMonthCapitalized(month).toUpperCase()}</span>
        <span className={styles.summaryValue}>{formatCurrency(summary?.total_liquid || 0)}</span>
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNum}>{summary?.total_routes || 0}</span>
            <span className={styles.summaryStatLabel}>ROTAS</span>
          </div>
          <div className={`${styles.summaryStat} ${styles.summaryStatBorder}`}>
            <span className={styles.summaryStatNum}>{formatNumber(summary?.total_km || 0, 0)}</span>
            <span className={styles.summaryStatLabel}>KM TOTAL</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNum}>{formatCurrency(summary?.total_fuel || 0)}</span>
            <span className={styles.summaryStatLabel}>COMBUST.</span>
          </div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>DIAS DO MÊS</span>
        <span className={styles.sectionCount}>{days.length} com rotas</span>
      </div>

      <div className={styles.list}>
        {days.length === 0 ? (
          <div className={styles.empty}>Nenhuma rota neste mês</div>
        ) : (
          days.map((day) => {
            const { weekday, day: dayNum, month: monthAbbr, isToday } = formatDayStr(day.day);
            return (
              <div
                key={day.day}
                className={styles.dayRow}
                onClick={() => navigate(`/?date=${day.day}`)}
              >
                <div className={`${styles.dateBadge} ${isToday ? styles.dateBadgeToday : ''}`}>
                  <span className={styles.badgeLabel}>{weekday.toUpperCase()}</span>
                  <span className={styles.badgeNum}>{dayNum}</span>
                </div>
                <div className={styles.dayContent}>
                  <div className={styles.dayNameRow}>
                    <span className={styles.dayName}>{weekday}-feira, {dayNum} {monthAbbr}</span>
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
    </div>
  );
}
