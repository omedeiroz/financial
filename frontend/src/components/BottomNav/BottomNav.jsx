import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, List, Plus, BarChart2, User } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav({ selectedDate }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === '/';
  const isRoutes = pathname === '/routes';
  const isHistory = pathname === '/history';
  const isProfile = pathname === '/profile';

  function handleNew() {
    const date = selectedDate || new Date().toISOString().slice(0, 10);
    navigate(`/routes/new?date=${date}`);
  }

  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.tab} ${isHome ? styles.active : ''}`}
        onClick={() => navigate('/')}
      >
        <CalendarDays size={20} strokeWidth={1.8} />
        <span className={styles.label}>Hoje</span>
      </button>

      <button
        className={`${styles.tab} ${isRoutes ? styles.active : ''}`}
        onClick={() => navigate('/routes')}
      >
        <List size={20} strokeWidth={1.8} />
        <span className={styles.label}>Rotas</span>
      </button>

      <button className={styles.addBtn} onClick={handleNew}>
        <div>
          <Plus size={20} strokeWidth={2} color="#fff" />
        </div>
      </button>

      <button
        className={`${styles.tab} ${isHistory ? styles.active : ''}`}
        onClick={() => navigate('/history')}
      >
        <BarChart2 size={20} strokeWidth={1.8} />
        <span className={styles.label}>Mês</span>
      </button>

      <button
        className={`${styles.tab} ${isProfile ? styles.active : ''}`}
        onClick={() => navigate('/profile')}
      >
        <User size={20} strokeWidth={1.8} />
        <span className={styles.label}>Perfil</span>
      </button>
    </nav>
  );
}
