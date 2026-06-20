import { useEffect, useRef } from 'react';
import styles from './DateStrip.module.css';

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function getMonthDays(month) {
  const [year, m] = month.split('-').map(Number);
  const daysInMonth = new Date(year, m, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const date = new Date(year, m - 1, d);
    const dd = String(d).padStart(2, '0');
    return {
      dateStr: `${year}-${String(m).padStart(2, '0')}-${dd}`,
      dayOfWeek: date.getDay(),
      dayNum: d,
    };
  });
}

export default function DateStrip({ selectedDate, month, onSelect }) {
  const stripRef = useRef(null);
  const days = getMonthDays(month);

  // Scroll selected day into center when it changes
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const activeBtn = strip.querySelector('[data-active="true"]');
    if (!activeBtn) return;
    const stripRect = strip.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const scrollLeft = activeBtn.offsetLeft - stripRect.width / 2 + btnRect.width / 2;
    strip.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }, [selectedDate]);

  return (
    <div className={styles.strip} ref={stripRef}>
      {days.map(({ dateStr, dayOfWeek, dayNum }) => {
        const isActive = dateStr === selectedDate;
        return (
          <button
            key={dateStr}
            data-active={isActive}
            className={`${styles.chip} ${isActive ? styles.active : ''}`}
            onClick={() => onSelect(dateStr)}
          >
            <span className={styles.label}>{DAYS[dayOfWeek]}</span>
            <span className={styles.num}>{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}
