import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Sun, Moon } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../../api/routes';
import BottomNav from '../../components/BottomNav/BottomNav';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency, formatNumber, toMonthStr } from '../../utils/format';
import styles from './Profile.module.css';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function currentYear() { return new Date().getFullYear(); }

function fmt(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
}

function dayNum(dayStr) { return Number(String(dayStr).slice(8, 10)); }

function buildPDF(routes, month, qLabel, qSuffix) {
  const [year, m] = month.split('-');
  const monthName = MONTH_FULL[parseInt(m, 10) - 1];
  const title = `Rotas — ${monthName} ${year}${qLabel}`;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(25, 25, 25);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(232, 230, 225);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 12);

  const totalLiquid = routes.reduce((s, r) => s + Number(r.final_value), 0);
  const totalKm     = routes.reduce((s, r) => s + Number(r.km_route), 0);
  const totalFuel   = routes.reduce((s, r) => s + Number(r.gnv_cost) + Number(r.gasoline_cost), 0);

  doc.setFontSize(9);
  doc.setTextColor(155, 150, 141);
  doc.setFont('helvetica', 'normal');
  doc.text(`${routes.length} rotas  ·  ${formatNumber(totalKm, 0)} km  ·  combustível ${fmt(totalFuel)}`, 14, 20);
  doc.setTextColor(91, 163, 114);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Líquido: ${fmt(totalLiquid)}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [['Data', 'Nome', 'Km', 'Valor Bruto', 'Backup', 'GNV', 'Gasolina', 'Líquido']],
    body: routes.map(r => [
      r.day.slice(0, 10).split('-').reverse().join('/'),
      r.name,
      `${formatNumber(r.km_route, 0)} km`,
      fmt(r.route_value),
      r.has_backup ? fmt(r.backup_value) : '—',
      Number(r.gnv_cost) > 0 ? fmt(r.gnv_cost) : '—',
      Number(r.gasoline_cost) > 0 ? fmt(r.gasoline_cost) : '—',
      fmt(r.final_value),
    ]),
    foot: [['', `Total: ${routes.length} rotas`, `${formatNumber(totalKm, 0)} km`, '', '', '', '', fmt(totalLiquid)]],
    styles: { fontSize: 8, cellPadding: 3, textColor: [50, 50, 50] },
    headStyles: { fillColor: [226, 97, 68], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [36, 110, 70] },
    },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(`Finanças · gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 290);
    doc.text(`${i}/${pageCount}`, 196, 290, { align: 'right' });
  }

  doc.save(`rotas-${month}${qSuffix}.pdf`);
}

export default function Profile() {
  const year = currentYear();
  const { theme, toggle } = useTheme();

  // Chart quinzena filter
  const [chartQ, setChartQ] = useState(0); // 0=ambas, 1=1ª, 2=2ª

  // Export state
  const [exportMonth, setExportMonth] = useState(toMonthStr(new Date()));
  const [exportQ1, setExportQ1] = useState(true);
  const [exportQ2, setExportQ2] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { data: alltime } = useQuery({
    queryKey: ['alltime-summary'],
    queryFn: api.getAlltimeSummary,
  });

  const { data: yearlyQ1 = [] } = useQuery({
    queryKey: ['yearly-summary', year, 1],
    queryFn: () => api.getYearlySummary(year, 1),
  });

  const { data: yearlyQ2 = [] } = useQuery({
    queryKey: ['yearly-summary', year, 2],
    queryFn: () => api.getYearlySummary(year, 2),
  });

  const combinedData = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const key = `${year}-${m}`;
    const q1 = yearlyQ1.find(r => r.month === key);
    const q2 = yearlyQ2.find(r => r.month === key);
    return {
      month: key,
      label: MONTH_NAMES[i],
      q1Liquid:     Number(q1?.total_liquid || 0),
      q2Liquid:     Number(q2?.total_liquid || 0),
      q1Routes:     Number(q1?.total_routes || 0),
      q2Routes:     Number(q2?.total_routes || 0),
      total_liquid: Number(q1?.total_liquid || 0) + Number(q2?.total_liquid || 0),
      total_routes: Number(q1?.total_routes || 0) + Number(q2?.total_routes || 0),
      total_km:     Number(q1?.total_km     || 0) + Number(q2?.total_km     || 0),
    };
  });

  // maxLiquid always uses the combined total so bar heights change visibly when filtering
  const maxLiquid = Math.max(...combinedData.map(m => m.total_liquid), 1);

  const monthlyData = combinedData.map(d => ({
    ...d,
    total_liquid: chartQ === 1 ? d.q1Liquid : chartQ === 2 ? d.q2Liquid : d.total_liquid,
    total_routes: chartQ === 1 ? d.q1Routes : chartQ === 2 ? d.q2Routes : d.total_routes,
  }));

  async function handleExport() {
    if (!exportQ1 && !exportQ2) return;
    setExporting(true);
    try {
      const all = await api.exportMonth(exportMonth);

      const bothSelected = exportQ1 && exportQ2;

      if (bothSelected) {
        if (!all.length) { alert('Nenhuma rota neste mês.'); return; }
        buildPDF(all, exportMonth, '', '');
      } else {
        if (exportQ1) {
          const q1 = all.filter(r => dayNum(r.day) <= 15);
          if (!q1.length) { alert('Nenhuma rota na 1ª quinzena.'); return; }
          buildPDF(q1, exportMonth, ' · 1ª Quinzena', '-q1');
        }
        if (exportQ2) {
          const q2 = all.filter(r => dayNum(r.day) > 15);
          if (!q2.length) { alert('Nenhuma rota na 2ª quinzena.'); return; }
          buildPDF(q2, exportMonth, ' · 2ª Quinzena', '-q2');
        }
      }
    } finally {
      setExporting(false);
    }
  }

  const firstDay = alltime?.first_day ? alltime.first_day.slice(0, 10) : null;
  const canExport = exportQ1 || exportQ2;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>PERFIL</span>
          <span className={styles.title}>Visão geral</span>
        </div>
        <button className={styles.themeBtn} onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
        </button>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>TODOS OS TEMPOS</span>
        {firstDay && (
          <span className={styles.since}>desde {firstDay.split('-').reverse().join('/')}</span>
        )}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{formatCurrency(alltime?.total_liquid || 0)}</span>
            <span className={styles.statLabel}>LÍQUIDO TOTAL</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{alltime?.total_routes || 0}</span>
            <span className={styles.statLabel}>ROTAS</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{formatNumber(alltime?.total_km || 0, 0)}</span>
            <span className={styles.statLabel}>KM TOTAL</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{formatCurrency(alltime?.total_fuel || 0)}</span>
            <span className={styles.statLabel}>COMBUSTÍVEL</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionRow}>
          <span className={styles.sectionLabel}>RESUMO {year}</span>
          <div className={styles.qTabs}>
            {[{ v: 0, l: 'Ambas' }, { v: 1, l: '1ª' }, { v: 2, l: '2ª' }].map(({ v, l }) => (
              <button
                key={v}
                className={`${styles.qTab} ${chartQ === v ? styles.qTabActive : ''}`}
                onClick={() => setChartQ(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.yearChart}>
          {monthlyData.map(({ month, label, total_liquid, total_routes }) => (
            <div key={month} className={styles.bar}>
              <span className={styles.barValue}>
                {total_liquid > 0 ? formatCurrency(total_liquid).replace('R$ ', '').replace('R$ ', '') : ''}
              </span>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ height: `${Math.round((total_liquid / maxLiquid) * 100)}%` }}
                />
              </div>
              <span className={styles.barLabel}>{label}</span>
              {total_routes > 0 && (
                <span className={styles.barRoutes}>{total_routes}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>EXPORTAR DADOS</span>
        <div className={styles.exportCard}>
          <div className={styles.exportRow}>
            <span className={styles.exportLabel}>Mês</span>
            <input
              type="month"
              className={styles.monthInput}
              value={exportMonth}
              onChange={e => setExportMonth(e.target.value)}
            />
          </div>
          <div className={styles.exportRow}>
            <span className={styles.exportLabel}>Quinzenas</span>
            <div className={styles.checkGroup}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={exportQ1}
                  onChange={e => setExportQ1(e.target.checked)}
                />
                <span className={`${styles.checkBox} ${exportQ1 ? styles.checkBoxOn : ''}`} />
                1ª (1–15)
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={exportQ2}
                  onChange={e => setExportQ2(e.target.checked)}
                />
                <span className={`${styles.checkBox} ${exportQ2 ? styles.checkBoxOn : ''}`} />
                2ª (16–30)
              </label>
            </div>
          </div>
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={exporting || !canExport}
          >
            <Download size={16} strokeWidth={1.8} />
            {exporting ? 'Gerando PDF...' : exportQ1 && exportQ2 ? 'Exportar mês completo' : 'Exportar quinzena'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
