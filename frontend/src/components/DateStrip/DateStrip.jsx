import styles from './DateStrip.module.css';

const DAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function getWeekDays(selectedDate) {
  const [year, month, day] = selectedDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dow = date.getDay();
  // Semana começa na segunda (1). Se for domingo (0), começa 6 dias atrás
  const startOffset = dow === 0 ? 6 : dow - 1;
  const monday = new Date(date);
  monday.setDate(date.getDate() - startOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${dd}`, dayOfWeek: (d.getDay() + 6) % 7, dayNum: d.getDate() };
  });
}

export default function DateStrip({ selectedDate, onSelect }) {
  const days = getWeekDays(selectedDate);

  return (
    <div className={styles.strip}>
      {days.map(({ dateStr, dayOfWeek, dayNum }) => (
        <button
          key={dateStr}
          className={`${styles.chip} ${dateStr === selectedDate ? styles.active : ''}`}
          onClick={() => onSelect(dateStr)}
        >
          <span className={styles.label}>{DAYS[dayOfWeek]}</span>
          <span className={styles.num}>{dayNum}</span>
        </button>
      ))}
    </div>
  );
}
