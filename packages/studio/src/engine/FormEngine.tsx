/**
 * FLYX Form Engine - FSL'den Otomatik ERP Ekrani
 * =================================================
 * 1C Managed Form Engine benzeri.
 * FSL entity/document/form schema'si verilir → tam ERP ekrani render edilir.
 * Hicbir TSX yazilmaz - her sey FSL'den gelir.
 *
 * Desteklenen ekran tipleri:
 * - Liste (entity listesi - tablo)
 * - Detay (tek kayit formu)
 * - Master-Detail (baslik + kalem tablosu - siparis, fatura)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FieldRenderer } from './FieldRenderer';
import { GridRenderer } from './GridRenderer';
import { TotalsRenderer } from './TotalsRenderer';
import { ActionRenderer } from './ActionRenderer';

export interface FormSchema {
  /** Entity/Document adi */
  entityName: string;
  /** Gorunum tipi */
  viewType: 'list' | 'detail' | 'master_detail';
  /** Baslik */
  title: string;
  /** Alan tanimlari */
  fields: FieldSchema[];
  /** Form section'lari (opsiyonel - yoksa tek section) */
  sections?: SectionSchema[];
  /** Kalem entity'si (master-detail icin) */
  linesEntity?: string;
  /** Kalem alanlari */
  linesFields?: FieldSchema[];
  /** Toplam tanimlari */
  totals?: TotalSchema[];
  /** Durum gecisi tanimlari */
  statusFlow?: string[];
  /** Aksiyon butonlari */
  actions?: ActionSchema[];
  /** Belge numaralama */
  numbering?: string;
  /** Yetkiler */
  permissions?: { create?: boolean; update?: boolean; delete?: boolean };
}

export interface FieldSchema {
  name: string;
  label: string;
  type: string; // String, Number, Decimal, Email, Enum, Relation, Boolean, Date, Text...
  params?: any[];
  required?: boolean;
  unique?: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  enumValues?: string[];
  /** Relation icin: lookup API endpoint */
  lookupEntity?: string;
  /** Gizli alan (tabloda gosterilmez) */
  hidden?: boolean;
  /** Genislik (tablo sutunu) */
  width?: string;
}

export interface SectionSchema {
  name: string;
  label: string;
  fields: string[];
  columns?: number; // 1, 2, 3
}

export interface TotalSchema {
  field: string;
  label: string;
  type: 'sum' | 'count' | 'avg';
  sourceField: string;
}

export interface ActionSchema {
  name: string;
  label: string;
  style: 'primary' | 'success' | 'danger' | 'default';
  /** Hangi durumda gorunur */
  visibleWhen?: string[];
  /** API endpoint (PUT /v1/sales/orders/:id/confirm gibi) */
  endpoint?: string;
}

interface FormEngineProps {
  schema: FormSchema;
  /** API base URL */
  apiBase: string;
  /** Mevcut kayit verisi (detay/edit modunda) */
  data?: Record<string, any>;
  /** Kalem satirlari (master-detail) */
  lines?: Record<string, any>[];
  /** Kaydetme callback */
  onSave?: (data: Record<string, any>, lines?: Record<string, any>[]) => Promise<void>;
  /** Aksiyon callback (onayla, sevk et vs.) */
  onAction?: (action: string) => Promise<void>;
  /** Lookup verisi cek */
  onLookup?: (entity: string, query?: string) => Promise<any[]>;
  /** Mod: 'view' | 'edit' | 'create' */
  mode?: 'view' | 'edit' | 'create';
}

export function FormEngine({ schema, apiBase, data, lines, onSave, onAction, onLookup, mode = 'create' }: FormEngineProps) {
  const [formData, setFormData] = useState<Record<string, any>>(data || {});
  const [formLines, setFormLines] = useState<Record<string, any>[]>(lines || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setFormData(data);
    if (lines) setFormLines(lines);
  }, [data, lines]);

  const isEditable = mode === 'create' || mode === 'edit';

  const updateField = useCallback((name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(formData, schema.viewType === 'master_detail' ? formLines : undefined);
    } finally {
      setSaving(false);
    }
  };

  // Section'lara gore alanlari grupla
  const sections = schema.sections || [{ name: 'main', label: '', fields: schema.fields.map((f) => f.name), columns: 2 }];

  return (
    <div className="space-y-6">
      {/* BASLIK */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{schema.title}</h1>
          {formData.status && (
            <StatusBadge status={formData.status} />
          )}
        </div>
        <div className="flex gap-2">
          {/* Durum gecis butonlari */}
          {schema.actions && (
            <ActionRenderer
              actions={schema.actions}
              currentStatus={formData.status}
              onAction={onAction}
              disabled={saving}
            />
          )}
          {/* Kaydet butonu */}
          {isEditable && (
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          )}
        </div>
      </div>

      {/* FORM ALANLARI (Section'lar) */}
      {sections.map((section) => {
        const sectionFields = schema.fields.filter((f) => section.fields.includes(f.name));
        if (sectionFields.length === 0) return null;

        return (
          <div key={section.name} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {section.label && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{section.label}</h3>
              </div>
            )}
            <div className={`p-6 grid gap-x-6 gap-y-4 grid-cols-${section.columns || 2}`}>
              {sectionFields.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  value={formData[field.name]}
                  onChange={(v) => updateField(field.name, v)}
                  readOnly={!isEditable || field.readOnly}
                  onLookup={onLookup}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* KALEM TABLOSU (Master-Detail) */}
      {schema.viewType === 'master_detail' && schema.linesFields && (
        <GridRenderer
          fields={schema.linesFields}
          lines={formLines}
          onLinesChange={setFormLines}
          readOnly={!isEditable}
          onLookup={onLookup}
        />
      )}

      {/* TOPLAMLAR */}
      {schema.totals && schema.totals.length > 0 && (
        <TotalsRenderer
          totals={schema.totals}
          lines={formLines}
          formData={formData}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-violet-100 text-violet-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    draft: 'Taslak', confirmed: 'Onaylandi', shipped: 'Sevk Edildi',
    delivered: 'Teslim Edildi', cancelled: 'Iptal',
    active: 'Aktif', inactive: 'Pasif',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mt-1 ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
