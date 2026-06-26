import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useRoute, useCreateRoute, useUpdateRoute } from '../../hooks/useRoutes';
import { calcFinalValue, formatCurrency } from '../../utils/format';
import styles from './RouteForm.module.css';

const BACKUP_VALUE = 140;

const empty = {
  day: new Date().toISOString().slice(0, 10),
  name: '',
  km_initial: '',
  km_final: '',
  route_value: '',
  has_backup: false,
  gnv_cost: '',
  gasoline_cost: '',
};




export default function RouteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const { data: existing } = useRoute(id);
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute(id);

  const initialDay = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ ...empty, day: initialDay });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existing) {
      setForm({
        day: String(existing.day).slice(0, 10),
        name: existing.name,
        km_initial: existing.km_initial,
        km_final: existing.km_final,
        route_value: existing.route_value,
        has_backup: existing.has_backup,
        gnv_cost: existing.gnv_cost || '',
        gasoline_cost: existing.gasoline_cost || '',
      });
    }
  }, [existing]);

  const kmRoute = form.km_final !== '' && form.km_initial !== ''
    ? Math.max(0, Number(form.km_final) - Number(form.km_initial))
    : '';

  const finalValue = calcFinalValue({
    route_value: form.route_value || 0,
    has_backup: form.has_backup,
    backup_value: BACKUP_VALUE,
    gnv_cost: form.gnv_cost || 0,
    gasoline_cost: form.gasoline_cost || 0,
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  }

  function validate() {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Nome obrigatório (mín. 2 caracteres)';
    if (form.km_final !== '' && form.km_initial !== '' && Number(form.km_final) < Number(form.km_initial))
      e.km_final = 'Km final deve ser ≥ km inicial';
    if (!form.route_value || Number(form.route_value) <= 0) e.route_value = 'Valor da rota obrigatório';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      day: form.day,
      name: form.name.trim(),
      km_initial: Number(form.km_initial) || 0,
      km_final: Number(form.km_final) || 0,
      route_value: Number(form.route_value),
      has_backup: form.has_backup,
      backup_value: form.has_backup ? BACKUP_VALUE : 0,
      gnv_cost: Number(form.gnv_cost) || 0,
      gasoline_cost: Number(form.gasoline_cost) || 0,
    };

    try {
      if (isEdit) {
        await updateRoute.mutateAsync(payload);
      } else {
        await createRoute.mutateAsync(payload);
      }
      navigate(-1);
    } catch (err) {
      setErrors({ _: err.message });
    }
  }

  const dateLabel = (() => {
    const [, m, d] = form.day.split('-');
    const months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
    return `${d} ${months[parseInt(m, 10) - 1]}`;
  })();

  const loading = createRoute.isPending || updateRoute.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ChevronLeft size={15} strokeWidth={1.8} color="var(--ink-2)" />
        </button>
        <span className={styles.title}>{isEdit ? 'Editar rota' : 'Nova rota'}</span>
        <span className={styles.dateLabel}>{dateLabel}</span>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Data</label>
          <input
            className={styles.inputDate}
            type="date"
            value={form.day}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => set('day', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nome da rota</label>
          <input
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            placeholder="ex: Centro → Shopping"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.kmRow}>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.label}>Km ini</label>
            <input
              className={styles.inputMono}
              type="number"
              placeholder="0"
              value={form.km_initial}
              onChange={(e) => set('km_initial', e.target.value)}
            />
          </div>
          <div className={styles.field} style={{ flex: 1 }}>
            <label className={styles.label}>Km fim</label>
            <input
              className={`${styles.inputMono} ${errors.km_final ? styles.inputError : ''}`}
              type="number"
              placeholder="0"
              value={form.km_final}
              onChange={(e) => set('km_final', e.target.value)}
            />
            {errors.km_final && <span className={styles.error}>{errors.km_final}</span>}
          </div>
          <div className={styles.field} style={{ width: 64 }}>
            <label className={styles.label}>Km rota</label>
            <input
              className={styles.inputKmRoute}
              type="number"
              value={kmRoute}
              readOnly
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Valor da rota</label>
          <div className={styles.inputPrefix}>
            <span className={styles.prefix}>R$</span>
            <input
              className={`${styles.input} ${errors.route_value ? styles.inputError : ''}`}
              type="number"
              placeholder="0,00"
              value={form.route_value}
              onChange={(e) => set('route_value', e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          {errors.route_value && <span className={styles.error}>{errors.route_value}</span>}
        </div>

        <div className={styles.backupCard}>
          <div className={styles.backupHeader}>
            <div>
              <span className={styles.backupTitle}>Backup</span>
              <span className={styles.backupDesc}>+ R$ 140,00 ao valor da rota</span>
            </div>
            <button
              className={`${styles.toggle} ${form.has_backup ? styles.toggleOn : ''}`}
              onClick={() => set('has_backup', !form.has_backup)}
            >
              <span className={styles.thumb} />
            </button>
          </div>
        </div>

        <div className={styles.fuelCard}>
          <div className={styles.fuelRow}>
            <div className={styles.fuelLabel}>
              <span className={styles.dot} style={{ background: 'var(--ok)' }} />
              <span>GNV</span>
            </div>
            <input
              className={styles.fuelInput}
              type="number"
              placeholder="0,00"
              value={form.gnv_cost}
              onChange={(e) => set('gnv_cost', e.target.value)}
            />
          </div>
          <div className={`${styles.fuelRow} ${styles.fuelRowBorder}`}>
            <div className={styles.fuelLabel}>
              <span className={styles.dot} style={{ background: '#DDA456' }} />
              <span>Gasolina</span>
            </div>
            <input
              className={styles.fuelInput}
              type="number"
              placeholder="0,00"
              value={form.gasoline_cost}
              onChange={(e) => set('gasoline_cost', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.preview}>
          <span className={styles.previewLabel}>VALOR FINAL</span>
          <span className={styles.previewFormula}>
            {`(R$${Number(form.route_value) || 0}${form.has_backup ? ' + R$140' : ''}) × 87,5%${Number(form.gnv_cost) > 0 ? ` − R$${form.gnv_cost}` : ''}${Number(form.gasoline_cost) > 0 ? ` − R$${form.gasoline_cost}` : ''}`}
          </span>
          <span className={`${styles.previewValue} ${finalValue >= 0 ? styles.previewOk : ''}`}>
            {formatCurrency(finalValue)}
          </span>
        </div>

        {errors._ && <div className={styles.error}>{errors._}</div>}
      </div>

      <div className={styles.footer}>
        <button className={styles.cancelBtn} onClick={() => navigate(-1)}>
          Cancelar
        </button>
        <button
          className={styles.saveBtn}
          onClick={handleSubmit}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
