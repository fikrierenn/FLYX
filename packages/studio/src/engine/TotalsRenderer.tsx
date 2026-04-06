/**
 * FLYX Studio - Toplam Blogu
 * ============================
 * Siparis/fatura alt toplam, KDV, genel toplam gosterimi.
 * Kalem satirlarindan otomatik hesaplama.
 */

import React from 'react';
import type { TotalSchema } from './FormEngine';

interface TotalsRendererProps {
  totals: TotalSchema[];
  lines: Record<string, any>[];
  formData: Record<string, any>;
}

export function TotalsRenderer({ totals, lines, formData }: TotalsRendererProps) {
  const calculated = totals.map((t) => {
    let value = 0;
    if (t.type === 'sum') {
      value = lines.reduce((sum, line) => sum + (Number(line[t.sourceField]) || 0), 0);
    } else if (t.type === 'count') {
      value = lines.length;
    } else if (t.type === 'avg' && lines.length > 0) {
      value = lines.reduce((sum, line) => sum + (Number(line[t.sourceField]) || 0), 0) / lines.length;
    }
    return { ...t, value: Math.round(value * 100) / 100 };
  });

  // Son satir (genel toplam) kalin ve buyuk
  const lastIdx = calculated.length - 1;

  return (
    <div className="flex justify-end">
      <div className="bg-white rounded-xl shadow-sm w-80 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toplamlar</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {calculated.map((t, i) => (
            <div key={t.field} className={`flex justify-between items-center px-5 ${i === lastIdx ? 'py-4' : 'py-2.5'}`}>
              <span className={`text-sm ${i === lastIdx ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                {t.label}
              </span>
              <span className={`font-mono ${i === lastIdx ? 'text-xl font-bold text-blue-600' : 'text-sm text-gray-700'}`}>
                {t.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
