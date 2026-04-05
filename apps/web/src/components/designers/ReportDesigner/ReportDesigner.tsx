/**
 * Report Visual Designer - Gorsel Rapor Tasarimcisi
 * ==================================================
 * Surukleme-birakma tabanli rapor tasarimi.
 *
 * Duzen:
 * ┌──────────┬─────────────────────┬──────────┐
 * │ Sutun    │ Rapor Onizleme      │ Ayarlar  │
 * │ Secici   │ (tablo + grafik)    │ Paneli   │
 * │          │                     │          │
 * │ [x] code │ ┌────┬──────┐      │ Baslik   │
 * │ [x] name │ │Kod │ Isim │      │ Filtre   │
 * │ [ ] desc │ ├────┼──────┤      │ Siralama │
 * │ [x] total│ │001 │ Ahmet│      │ Grafik   │
 * │          │ └────┴──────┘      │          │
 * ├──────────┴─────────────────────┴──────────┤
 * │ FSL Kod Onizleme                          │
 * └───────────────────────────────────────────┘
 */

import React, { useState, useMemo } from 'react';

interface ReportColumn {
  id: string;
  name: string;
  label: string;
  visible: boolean;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percent';
}

interface ReportParameter {
  id: string;
  name: string;
  type: 'DateRange' | 'Enum' | 'Lookup' | 'String';
  label: string;
  defaultValue?: string;
}

interface ChartConfig {
  type: 'none' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'donut_chart';
  xAxis?: string;
  yAxis?: string;
}

// Ornek entity field'lari (normalde FSL compiler'dan gelir)
const AVAILABLE_FIELDS = [
  { name: 'code', label: 'Kod', format: 'text' as const },
  { name: 'name', label: 'Isim', format: 'text' as const },
  { name: 'email', label: 'Email', format: 'text' as const },
  { name: 'phone', label: 'Telefon', format: 'text' as const },
  { name: 'status', label: 'Durum', format: 'text' as const },
  { name: 'total', label: 'Toplam', format: 'currency' as const },
  { name: 'quantity', label: 'Miktar', format: 'number' as const },
  { name: 'created_date', label: 'Tarih', format: 'date' as const },
];

// Ornek rapor verisi (mock)
const MOCK_DATA = [
  { code: 'C001', name: 'Ahmet Yilmaz', email: 'ahmet@test.com', status: 'active', total: 15000, quantity: 42, created_date: '2026-01-15' },
  { code: 'C002', name: 'Ayse Demir', email: 'ayse@test.com', status: 'active', total: 28500, quantity: 67, created_date: '2026-02-20' },
  { code: 'C003', name: 'Mehmet Kaya', email: 'mehmet@test.com', status: 'inactive', total: 5200, quantity: 12, created_date: '2026-03-10' },
  { code: 'C004', name: 'Fatma Ozturk', email: 'fatma@test.com', status: 'active', total: 41000, quantity: 89, created_date: '2026-01-28' },
  { code: 'C005', name: 'Ali Celik', email: 'ali@test.com', status: 'blocked', total: 3100, quantity: 8, created_date: '2026-03-05' },
];

export function ReportDesigner() {
  const [reportName, setReportName] = useState('SalesReport');
  const [reportTitle, setReportTitle] = useState('Satis Raporu');

  const [columns, setColumns] = useState<ReportColumn[]>(
    AVAILABLE_FIELDS.map((f, i) => ({
      id: String(i),
      name: f.name,
      label: f.label,
      visible: ['code', 'name', 'status', 'total'].includes(f.name),
      format: f.format,
    })),
  );

  const [parameters, setParameters] = useState<ReportParameter[]>([
    { id: '1', name: 'date_range', type: 'DateRange', label: 'Tarih Araligi', defaultValue: 'this_month' },
  ]);

  const [chart, setChart] = useState<ChartConfig>({ type: 'bar_chart', xAxis: 'name', yAxis: 'total' });
  const [sortBy, setSortBy] = useState('total');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  const visibleColumns = columns.filter((c) => c.visible);

  // Siralama uygula
  const sortedData = useMemo(() => {
    return [...MOCK_DATA].sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (typeof aVal === 'number') return sortDir === 'ASC' ? aVal - bVal : bVal - aVal;
      return sortDir === 'ASC' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
  }, [sortBy, sortDir]);

  const toggleColumn = (id: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  };

  const updateColumnLabel = (id: string, label: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, label } : c)));
  };

  // Basit bar chart SVG
  const renderChart = () => {
    if (chart.type === 'none') return null;
    const maxVal = Math.max(...MOCK_DATA.map((d) => (d as any)[chart.yAxis || 'total'] || 0));
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-xs text-gray-500 uppercase mb-3">{chart.type.replace('_', ' ')}</h4>
        <div className="flex items-end gap-2 h-32">
          {sortedData.map((row, i) => {
            const val = (row as any)[chart.yAxis || 'total'] || 0;
            const height = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500">{val.toLocaleString()}</span>
                <div
                  className="w-full bg-blue-500 rounded-t transition-all"
                  style={{ height: `${height}%`, minHeight: '2px' }}
                />
                <span className="text-[9px] text-gray-500 truncate max-w-full">
                  {(row as any)[chart.xAxis || 'name']?.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // FSL kod uretimi
  const fslCode = useMemo(() => {
    let fsl = `report ${reportName} {\n`;
    fsl += `  title: "${reportTitle}"\n\n`;

    if (parameters.length > 0) {
      fsl += `  parameters {\n`;
      for (const p of parameters) {
        fsl += `    ${p.name}: ${p.type}`;
        if (p.defaultValue) fsl += ` { default: "${p.defaultValue}" }`;
        fsl += `\n`;
      }
      fsl += `  }\n\n`;
    }

    fsl += `  columns {\n`;
    for (const col of visibleColumns) {
      fsl += `    ${col.name} { label: "${col.label}"`;
      if (col.format && col.format !== 'text') fsl += `, format: "${col.format}"`;
      fsl += ` }\n`;
    }
    fsl += `  }\n`;

    if (chart.type !== 'none') {
      fsl += `\n  visualizations {\n`;
      fsl += `    chart1 {\n`;
      fsl += `      type: "${chart.type}"\n`;
      if (chart.xAxis) fsl += `      x_axis: "${chart.xAxis}"\n`;
      if (chart.yAxis) fsl += `      y_axis: "${chart.yAxis}"\n`;
      fsl += `    }\n`;
      fsl += `  }\n`;
    }

    fsl += `}`;
    return fsl;
  }, [reportName, reportTitle, parameters, visibleColumns, chart]);

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
      {/* Sol: Sutun Secici */}
      <div className="col-span-2 bg-white rounded-lg shadow p-4 overflow-y-auto border-r border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sutunlar</h3>
        <div className="space-y-1">
          {columns.map((col) => (
            <label key={col.id} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => toggleColumn(col.id)}
                className="rounded border-gray-300"
              />
              <span className={col.visible ? 'text-gray-800' : 'text-gray-400'}>{col.label}</span>
            </label>
          ))}
        </div>

        {/* Parametre Ekleme */}
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parametreler</h3>
          {parameters.map((p) => (
            <div key={p.id} className="text-xs text-gray-600 px-2 py-1">
              {p.label} ({p.type})
            </div>
          ))}
        </div>
      </div>

      {/* Orta: Rapor Onizleme */}
      <div className="col-span-7 bg-gray-50 rounded-lg shadow p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{reportTitle}</h3>

        {/* Tablo */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    onClick={() => { setSortBy(col.name); setSortDir((d) => d === 'ASC' ? 'DESC' : 'ASC'); }}
                    className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    {col.label}
                    {sortBy === col.name && (sortDir === 'ASC' ? ' ↑' : ' ↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  {visibleColumns.map((col) => (
                    <td key={col.id} className={`px-4 py-2 ${col.format === 'currency' || col.format === 'number' ? 'text-right font-mono' : ''}`}>
                      {col.format === 'currency'
                        ? `₺${((row as any)[col.name] || 0).toLocaleString()}`
                        : col.name === 'status'
                          ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              (row as any).status === 'active' ? 'bg-green-100 text-green-700' :
                              (row as any).status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                              'bg-red-100 text-red-700'
                            }`}>{(row as any)[col.name]}</span>
                          : String((row as any)[col.name] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grafik */}
        {renderChart()}
      </div>

      {/* Sag: Ayarlar Paneli */}
      <div className="col-span-3 bg-white rounded-lg shadow p-4 overflow-y-auto space-y-4 border-l border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rapor Ayarlari</h3>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Rapor Adi</label>
          <input value={reportName} onChange={(e) => setReportName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Baslik</label>
          <input value={reportTitle} onChange={(e) => setReportTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>

        {/* Sutun Etiket Duzenleme */}
        <div>
          <h4 className="text-xs text-gray-500 font-medium mb-2">Sutun Etiketleri</h4>
          {visibleColumns.map((col) => (
            <div key={col.id} className="flex gap-2 mb-1">
              <span className="text-xs text-gray-400 w-16 truncate">{col.name}</span>
              <input value={col.label} onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                className="flex-1 px-2 py-0.5 text-xs border rounded" />
            </div>
          ))}
        </div>

        {/* Grafik Ayarlari */}
        <div className="pt-3 border-t">
          <h4 className="text-xs text-gray-500 font-medium mb-2">Grafik</h4>
          <select value={chart.type} onChange={(e) => setChart({ ...chart, type: e.target.value as ChartConfig['type'] })}
            className="w-full px-2 py-1 text-xs border rounded mb-2">
            <option value="none">Grafik Yok</option>
            <option value="bar_chart">Cubuk Grafik</option>
            <option value="line_chart">Cizgi Grafik</option>
            <option value="pie_chart">Pasta Grafik</option>
          </select>
          {chart.type !== 'none' && (
            <>
              <div className="flex gap-2 mb-1">
                <label className="text-xs text-gray-400">X:</label>
                <select value={chart.xAxis} onChange={(e) => setChart({ ...chart, xAxis: e.target.value })}
                  className="flex-1 px-2 py-0.5 text-xs border rounded">
                  {visibleColumns.map((c) => <option key={c.id} value={c.name}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <label className="text-xs text-gray-400">Y:</label>
                <select value={chart.yAxis} onChange={(e) => setChart({ ...chart, yAxis: e.target.value })}
                  className="flex-1 px-2 py-0.5 text-xs border rounded">
                  {visibleColumns.filter((c) => c.format === 'currency' || c.format === 'number').map((c) => <option key={c.id} value={c.name}>{c.label}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Siralama */}
        <div className="pt-3 border-t">
          <h4 className="text-xs text-gray-500 font-medium mb-2">Siralama</h4>
          <div className="flex gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border rounded">
              {visibleColumns.map((c) => <option key={c.id} value={c.name}>{c.label}</option>)}
            </select>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'ASC' | 'DESC')}
              className="px-2 py-1 text-xs border rounded">
              <option value="ASC">Artan</option>
              <option value="DESC">Azalan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alt: FSL Kod Onizleme */}
      <div className="col-span-12 bg-gray-900 rounded-lg shadow p-4 max-h-[200px] overflow-auto border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Uretilen FSL Kodu</span>
          <button onClick={() => navigator.clipboard.writeText(fslCode)}
            className="text-xs text-gray-400 hover:text-white transition-colors">Kopyala</button>
        </div>
        <pre className="text-green-400 text-sm font-mono">{fslCode}</pre>
      </div>
    </div>
  );
}
