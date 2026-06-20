import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil } from 'lucide-react';
import { useRoute, useDeleteRoute } from '../../hooks/useRoutes';
import { formatCurrency, formatNumber, formatDateEyebrow } from '../../utils/format';
import styles from './RouteDetail.module.css';

export default function RouteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: route, isLoading } = useRoute(id);
  const deleteRoute = useDeleteRoute();
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading) return <div className={styles.loading}>Carregando...</div>;
  if (!route) return <div className={styles.loading}>Rota não encontrada</div>;

  const discount = (Number(route.route_value) + Number(route.backup_value)) * 0.125;

  async function handleDelete() {
    await deleteRoute.mutateAsync(id);
    navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={15} strokeWidth={1.8} color="var(--ink-2)" />
        </button>
        <span className={styles.title}>Detalhe da rota</span>
        <button className={styles.iconBtn} onClick={() => navigate(`/routes/${id}/edit`)}>
          <Pencil size={15} strokeWidth={1.8} color="var(--ink-2)" />
        </button>
      </div>

      <div className={styles.info}>
        <span className={styles.eyebrow}>{formatDateEyebrow(route.day)}</span>
        <span className={styles.name}>{route.name}</span>
      </div>

      <div className={styles.hero}>
        <span className={styles.heroEyebrow}>VALOR FINAL LÍQUIDO</span>
        <span className={styles.heroValue}>{formatCurrency(route.final_value)}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>KM ROTA</span>
          <span className={styles.cardValue}>{formatNumber(route.km_route, 0)}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>KM INI → FIM</span>
          <span className={styles.cardValue}>{formatNumber(route.km_initial, 0)} → {formatNumber(route.km_final, 0)}</span>
        </div>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.bRow}>
          <span className={styles.bLabel}>Valor bruto</span>
          <span className={styles.bVal} style={{ color: 'var(--ink-1)' }}>{formatCurrency(route.route_value)}</span>
        </div>
        <div className={styles.bRow}>
          <span className={styles.bLabel}>Backup</span>
          <span className={styles.bVal} style={{ color: route.has_backup ? 'var(--ink-1)' : 'var(--ink-4)' }}>
            {route.has_backup ? formatCurrency(route.backup_value) : '—'}
          </span>
        </div>
        <div className={styles.bRow}>
          <span className={styles.bLabel}>Desconto 12,5%</span>
          <span className={styles.bVal} style={{ color: 'var(--danger)' }}>−{formatCurrency(discount)}</span>
        </div>
        <div className={styles.bRow}>
          <span className={styles.bLabel}>
            <span className={styles.dot} style={{ background: 'var(--ok)' }} /> GNV
          </span>
          <span className={styles.bVal} style={{ color: Number(route.gnv_cost) > 0 ? 'var(--danger)' : 'var(--ink-4)' }}>
            {Number(route.gnv_cost) > 0 ? `−${formatCurrency(route.gnv_cost)}` : '—'}
          </span>
        </div>
        <div className={styles.bRow}>
          <span className={styles.bLabel}>
            <span className={styles.dot} style={{ background: '#DDA456' }} /> Gasolina
          </span>
          <span className={styles.bVal} style={{ color: Number(route.gasoline_cost) > 0 ? 'var(--danger)' : 'var(--ink-4)' }}>
            {Number(route.gasoline_cost) > 0 ? `−${formatCurrency(route.gasoline_cost)}` : '—'}
          </span>
        </div>
        <div className={`${styles.bRow} ${styles.bRowTotal}`}>
          <span className={styles.bLabelTotal}>Total líquido</span>
          <span className={styles.bValTotal}>{formatCurrency(route.final_value)}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.editBtn} onClick={() => navigate(`/routes/${id}/edit`)}>
          Editar
        </button>
        <button className={styles.deleteBtn} onClick={() => setShowConfirm(true)}>
          Excluir
        </button>
      </div>

      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <span className={styles.sheetTitle}>Excluir rota?</span>
            <span className={styles.sheetSub}>{route.name}</span>
            <div className={styles.sheetActions}>
              <button className={styles.sheetCancel} onClick={() => setShowConfirm(false)}>
                Cancelar
              </button>
              <button
                className={styles.sheetDelete}
                onClick={handleDelete}
                disabled={deleteRoute.isPending}
              >
                {deleteRoute.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
