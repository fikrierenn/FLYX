/**
 * FLYX Studio - Kalem Tablosu (Master-Detail Grid)
 * ===================================================
 * Siparis/fatura kalem satirlarini tablo olarak gosterir.
 * Satir ekleme, silme, inline duzenleme, otomatik hesaplama.
 */

import React from 'react';
import type { FieldSchema } from './FormEngine';
import { Plus, Trash2 } from 'lucide-react';

interface GridRendererProps {
  fields: FieldSchema[];
  lines: Record<string, any>[];
  onLinesChange: (lines: Record<string, any>[]) => void;
  readOnly?: boolean;
  onLookup?: (entity: string, query?: string) => Promise<any[]>;
}

export function GridRenderer({ fields, lines, onLinesChange, readOnly, onLookup }: GridRendererProps) {
  const addLine = () => {
    const newLine: Record<string, any> = {};
    fields.forEach((f) => { newLine[f.name] = f.defaultValue ?? ''; });
    onLinesChange([...lines, newLine]);
  };

  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    onLinesChange(updated);
  };

  const removeLine = (index: number) => {
    onLinesChange(lines.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kalemler</h3>
        {!readOnly && (
          <button onClick={addLine}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700">
            <Plus className="w-3.5 h-3.5" /> Satir Ekle
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-3 py-2.5 text-left text-[10px] font-medium text-gray-400 w-8">#</th>
              {fields.filter((f) => !f.hidden).map((f) => (
                <th key={f.name} className={`px-3 py-2.5 text-[10px] font-medium text-gray-400 ${
                  isNumeric(f.type) ? 'text-right' : 'text-left'
                }`} style={{ width: f.width }}>
                  {f.label}
                </th>
              ))}
              {!readOnly && <th className="px-3 py-2.5 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={fields.filter((f) => !f.hidden).length + 2} className="px-6 py-10 text-center text-gray-400 text-sm">
                  {readOnly ? 'Kalem yok' : '"Satir Ekle" ile kalem ekleyin'}
                </td>
              </tr>
            ) : lines.map((line, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-blue-50/20">
                <td className="px-3 py-1 text-xs text-gray-400">{i + 1}</td>
                {fields.filter((f) => !f.hidden).map((f) => (
                  <td key={f.name} className="px-1 py-1">
                    {f.readOnly || readOnly ? (
                      <span className={`block px-2 py-1.5 text-sm ${isNumeric(f.type) ? 'text-right font-mono' : ''}`}>
                        {formatGridValue(line[f.name], f.type)}
                      </span>
                    ) : f.type === 'Enum' && f.enumValues ? (
                      <select value={line[f.name] ?? ''} onChange={(e) => updateLine(i, f.name, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none">
                        <option value="">-</option>
                        {f.enumValues.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <input
                        type={isNumeric(f.type) ? 'number' : 'text'}
                        value={line[f.name] ?? ''}
                        onChange={(e) => updateLine(i, f.name, isNumeric(f.type) ? Number(e.target.value) : e.target.value)}
                        step={f.type === 'Decimal' || f.type === 'Money' ? '0.01' : undefined}
                        className={`w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none ${
                          isNumeric(f.type) ? 'text-right font-mono' : ''
                        }`}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td className="px-1 py-1 text-center">
                    <button onClick={() => removeLine(i)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isNumeric(type: string): boolean {
  return ['Number', 'Decimal', 'Money'].includes(type);
}

function formatGridValue(value: any, type: string): string {
  if (value == null || value === '') return '-';
  if (isNumeric(type)) return Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  return String(value);
}
