import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MonthNav from '../../components/MonthNav/MonthNav';
import DateStrip from '../../components/DateStrip/DateStrip';
import RouteRow from '../../components/RouteRow/RouteRow';
import BottomNav from '../../components/BottomNav/BottomNav';
import { useRoutesByDate } from '../../hooks/useRoutes';
import { useMonthlySummary } from '../../hooks/useSummary';
import { formatCurrency, formatNumber, toDateStr, toMonthStr } from '../../utils/format';
import styles from './DailyView.module.css';

function getMonthFromDate(dateStr) {
  return dateStr.slice(0, 7);
}

function addMonths(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthStr(d);
}

export default function DailyView() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || toDateStr(new Date());

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(getMonthFromDate(initialDate));

  // Sincroniza quando navegar de outra tela com ?date=
  useEffect(() => {
    const dateFromUrl = searchParams.get('date');
    if (dateFromUrl && dateFromUrl !== selectedDate) {
      setSelectedDate(dateFromUrl);
      setMonth(getMonthFromDate(dateFromUrl));
    }
  }, [searchParams]);

  const { data: routes = [], isLoading, isError, refetch } = useRoutesByDate(selectedDate);
  const { data: summary } = useMonthlySummary(month);

  const dailyTotal = routes.reduce((sum, r) => sum + Number(r.final_value), 0);
  const dailyKm = routes.reduce((sum, r) => sum + Number(r.km_route), 0);

  function handleSelectDate(date) {
    setSelectedDate(date);
    setMonth(getMonthFromDate(date));
  }

  function handlePrevMonth() {
    const newMonth = addMonths(month, -1);
    setMonth(newMonth);
    const firstOfMonth = `${newMonth}-01`;
    setSelectedDate(firstOfMonth);
  }

  function handleNextMonth() {
    const newMonth = addMonths(month, 1);
    setMonth(newMonth);
    const firstOfMonth = `${newMonth}-01`;
    setSelectedDate(firstOfMonth);
  }

  return (
    <div className={styles.page}>
      <MonthNav month={month} onPrev={handlePrevMonth} onNext={handleNextMonth} />

      <DateStrip selectedDate={selectedDate} month={month} onSelect={handleSelectDate} />

      <div className={styles.hero}>
        <span className={styles.heroEyebrow}>
          {selectedDate === toDateStr(new Date()) ? 'VALOR LÍQUIDO HOJE' : `VALOR LÍQUIDO · ${selectedDate.split('-').reverse().slice(0,2).join('/')}`}
        </span>
        <span className={styles.heroValue}>{formatCurrency(dailyTotal)}</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{routes.length}</span>
          <span className={styles.statLabel}>ROTAS</span>
        </div>
        <div className={`${styles.stat} ${styles.statBorder}`}>
          <span className={styles.statNum}>{formatNumber(dailyKm, 0)}</span>
          <span className={styles.statLabel}>KM HOJE</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{formatCurrency(summary?.total_liquid || 0)}</span>
          <span className={styles.statLabel}>MÊS LÍQ.</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.sectionLabel}>ROTAS DO DIA</div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.feedback}>
            <div className={styles.spinner} />
            <span>Carregando...</span>
          </div>
        ) : isError ? (
          <div className={styles.feedback}>
            <span>Erro ao carregar rotas.</span>
            <button className={styles.retryBtn} onClick={() => refetch()}>Tentar novamente</button>
          </div>
        ) : routes.length === 0 ? (
          <div className={styles.empty}>Nenhuma rota registrada hoje</div>
        ) : (
          routes.map((route) => <RouteRow key={route.id} route={route} />)
        )}
      </div>

      <BottomNav selectedDate={selectedDate} />
    </div>
  );
}
