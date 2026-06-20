import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthCapitalized } from '../../utils/format';
import styles from './MonthNav.module.css';

export default function MonthNav({ month, onPrev, onNext }) {
  return (
    <div className={styles.nav}>
      <button className={styles.chevron} onClick={onPrev}>
        <ChevronLeft size={16} strokeWidth={1.8} />
      </button>
      <span className={styles.label}>{formatMonthCapitalized(month)}</span>
      <button className={styles.chevron} onClick={onNext}>
        <ChevronRight size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}
