import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../../utils/format';
import styles from './RouteRow.module.css';

export default function RouteRow({ route }) {
  const navigate = useNavigate();

  const detail = [
    route.km_route ? `${formatNumber(route.km_route, 0)} km` : null,
    Number(route.gnv_cost) > 0 ? `GNV ${formatCurrency(route.gnv_cost)}` : null,
    Number(route.gasoline_cost) > 0 ? `Gasolina ${formatCurrency(route.gasoline_cost)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className={styles.row} onClick={() => navigate(`/routes/${route.id}`)}>
      <div className={styles.bar} />
      <div className={styles.content}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{route.name}</span>
          {route.has_backup && <span className={styles.badge}>backup</span>}
        </div>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
      <span className={styles.value}>{formatCurrency(route.final_value)}</span>
    </div>
  );
}
