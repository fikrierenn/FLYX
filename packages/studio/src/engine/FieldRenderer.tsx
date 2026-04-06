/**
 * FLYX Studio - Alan Render Motoru
 * ==================================
 * FSL field tipine gore uygun HTML input/select/checkbox render eder.
 * Relation alanlari icin lookup dropdown destegi.
 */

import React, { useState, useEffect } from 'react';
import type { FieldSchema } from './FormEngine';

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  readOnly?: boolean;
  onLookup?: (entity: string, query?: string) => Promise<any[]>;
}

const INPUT_CLASS = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all';
const READONLY_CLASS = 'w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed';

export function FieldRenderer({ field, value, onChange, readOnly, onLookup }: FieldRendererProps) {
  const cls = readOnly ? READONLY_CLASS : INPUT_CLASS;

  return (
    <div className={field.type === 'Text' ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {/* Enum → Select */}
      {field.type === 'Enum' && field.enumValues ? (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={readOnly} className={cls}>
          <option value="">Secin...</option>
          {field.enumValues.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>

      /* Boolean → Checkbox */
      ) : field.type === 'Boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer py-2">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-sm text-gray-600">{value ? 'Evet' : 'Hayir'}</span>
        </label>

      /* Text → Textarea */
      ) : field.type === 'Text' ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly} rows={3} className={cls + ' resize-none'} />

      /* Relation → Lookup */
      ) : field.type === 'Relation' && field.lookupEntity ? (
        <RelationLookup field={field} value={value} onChange={onChange} readOnly={readOnly} onLookup={onLookup} />

      /* Decimal/Money → Sayi input */
      ) : field.type === 'Decimal' || field.type === 'Money' || field.type === 'Number' ? (
        <input type="number" value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}
          readOnly={readOnly} step={field.type === 'Number' ? '1' : '0.01'} className={cls + ' text-right font-mono'} />

      /* Date */
      ) : field.type === 'Date' ? (
        <input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly} className={cls} />

      /* DateTime */
      ) : field.type === 'DateTime' ? (
        <input type="datetime-local" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly} className={cls} />

      /* Email */
      ) : field.type === 'Email' ? (
        <input type="email" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly} placeholder={field.label} className={cls} />

      /* Phone */
      ) : field.type === 'Phone' ? (
        <input type="tel" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly} placeholder={field.label} className={cls} />

      /* Default → Text input */
      ) : (
        <input type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly} placeholder={field.label} className={cls} />
      )}
    </div>
  );
}

/** Relation alan icin lookup dropdown */
function RelationLookup({ field, value, onChange, readOnly, onLookup }: FieldRendererProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!field.lookupEntity || !onLookup) return;
    setLoading(true);
    onLookup(field.lookupEntity).then(setOptions).catch(() => {}).finally(() => setLoading(false));
  }, [field.lookupEntity]);

  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
      disabled={readOnly || loading}
      className={readOnly ? READONLY_CLASS : INPUT_CLASS}>
      <option value="">{loading ? 'Yukleniyor...' : 'Secin...'}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>{o.code ? `${o.code} - ${o.name}` : o.name || o.id}</option>
      ))}
    </select>
  );
}
