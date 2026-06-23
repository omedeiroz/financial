import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../../api/routes';
import BottomNav from '../../components/BottomNav/BottomNav';
import { formatCurrency, formatNumber, toMonthStr } from '../../utils/format';
import styles from './Profile.module.css';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MONTH_FULL  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function currentYear() {
  return new Date().getFullYear();
}

function fmt(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
}

function exportPDF(routes, month) {
  const [year, m] = month.split('-');
  const monthName = MONTH_FULL[parseInt(m, 10) - 1];
  const title = `Rotas — ${monthName} ${year}`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFillColor(25, 25, 25);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(232, 230, 225);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 12);

  // Totais do mês
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

  // Tabela
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
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [50, 50, 50],
    },
    headStyles: {
      fillColor: [226, 97, 68],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 8,
    },
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

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(`Finanças · gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 290);
    doc.text(`${i}/${pageCount}`, 196, 290, { align: 'right' });
  }

  doc.save(`rotas-${month}.pdf`);
}

export default function Profile() {
  const year = currentYear();
  const [exportMonth, setExportMonth] = useState(toMonthStr(new Date()));
  const [exporting, setExporting] = useState(false);

  const { data: alltime } = useQuery({
    queryKey: ['alltime-summary'],
    queryFn: api.getAlltimeSummary,
  });

  const { data: yearly = [] } = useQuery({
    queryKey: ['yearly-summary', year],
    queryFn: () => api.getYearlySummary(year),
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const key = `${year}-${m}`;
    const found = yearly.find(r => r.month === key);
    return { month: key, label: MONTH_NAMES[i], ...(found || { total_liquid: 0, total_routes: 0, total_km: 0 }) };
  });

  const maxLiquid = Math.max(...monthlyData.map(m => m.total_liquid), 1);

  async function handleExport() {
    setExporting(true);
    try {
      const routes = await api.exportMonth(exportMonth);
      if (!routes.length) { alert('Nenhuma rota neste mês.'); return; }
      exportPDF(routes, exportMonth);
    } finally {
      setExporting(false);
    }
  }

  const firstDay = alltime?.first_day ? alltime.first_day.slice(0, 10) : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>PERFIL</span>
        <span className={styles.title}>Visão geral</span>
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
        <span className={styles.sectionLabel}>RESUMO {year}</span>
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
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={16} strokeWidth={1.8} />
            {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
