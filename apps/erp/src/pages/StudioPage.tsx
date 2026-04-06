/**
 * FLYX Studio Sayfasi
 * =====================
 * Tum ERP ekranlari bu tek sayfa uzerinden render edilir.
 * URL'den entity adi alinir → API'den schema cekilir → Studio FormEngine render eder.
 * Hicbir entity-specific TSX yok.
 *
 * Modlar:
 * - list: entity listesi (tablo)
 * - detail: tek kayit formu (olustur/duzenle)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FormEngine, SchemaBuilder } from '@flyx/studio';
import type { FormSchema } from '@flyx/studio';
import { apiGet, apiPost, apiPut, apiDelete } from '../stores/api';
import { fieldLabel, formatValue, statusColor, statusLabel } from '../lib/format';
import { Plus, ArrowLeft, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudioPageProps {
  entityName: string;
  title: string;
  /** Kalem entity (master-detail icin) */
  linesEntity?: string;
}

export function StudioPage({ entityName, title, linesEntity }: StudioPageProps) {
  const [mode, setMode] = useState<'list' | 'detail'>('list');
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [schema, setSchema] = useState<any>(null);
  const [linesSchema, setLinesSchema] = useState<any>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedLines, setSelectedLines] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Schema yukle
  useEffect(() => {
    apiGet(`/v1/data/_meta/schema/${entityName}`).then((s) => {
      setSchema(s);
      if (linesEntity) {
        apiGet(`/v1/data/_meta/schema/${linesEntity}`).then(setLinesSchema);
      }
    }).catch(() => {});
  }, [entityName]);

  // Data yukle
  useEffect(() => { loadList(); }, [entityName, page]);

  const loadList = () => {
    apiGet(`/v1/data/${entityName}?page=${page}&limit=15`).then((d) => {
      setRecords(d.data || []);
      setTotal(d.total || 0);
    }).catch(() => setRecords([]));
  };

  // FormSchema olustur (detail modu icin)
  useEffect(() => {
    if (!schema) return;
    const fs = SchemaBuilder.build(schema, {
      viewType: linesEntity ? 'master_detail' : 'detail',
      title,
      linesEntity,
      linesSchema: linesSchema || undefined,
    });
    setFormSchema(fs);
  }, [schema, linesSchema]);

  // Yeni kayit
  const openNew = () => {
    setSelectedRecord({});
    setSelectedLines([]);
    setMode('detail');
  };

  // Kayit duzenle
  const openEdit = (record: any) => {
    setSelectedRecord(record);
    // Kalem satirlarini cek (varsa)
    if (linesEntity) {
      apiGet(`/v1/data/${linesEntity}?limit=100`).then((d) => {
        const lines = (d.data || []).filter((l: any) =>
          l[entityName.toLowerCase()] === record.id || l.sales_order === record.id,
        );
        setSelectedLines(lines);
      });
    }
    setMode('detail');
  };

  // Kaydet
  const handleSave = async (data: Record<string, any>, lines?: Record<string, any>[]) => {
    if (selectedRecord?.id) {
      await apiPut(`/v1/data/${entityName}/${selectedRecord.id}`, data);
    } else {
      const created = await apiPost(`/v1/data/${entityName}`, data);
      // Kalem satirlarini da kaydet
      if (lines && linesEntity) {
        for (const line of lines) {
          await apiPost(`/v1/data/${linesEntity}`, { ...line, sales_order: created.id });
        }
      }
    }
    setMode('list');
    loadList();
  };

  // Durum degistir
  const handleAction = async (action: string) => {
    if (!selectedRecord?.id) return;
    await apiPut(`/v1/sales/orders/${selectedRecord.id}/${action}`);
    // Yenile
    const updated = await apiGet(`/v1/sales/orders/${selectedRecord.id}`);
    setSelectedRecord(updated);
  };

  // Sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu kaydi silmek istediginize emin misiniz?')) return;
    await apiDelete(`/v1/data/${entityName}/${id}`);
    loadList();
  };

  // Lookup
  const handleLookup = async (entity: string, query?: string) => {
    const d = await apiGet(`/v1/data/${entity}?limit=30`);
    return d.data || [];
  };

  // ============================================================
  // LISTE MODU
  // ============================================================
  if (mode === 'list') {
    const HIDDEN = new Set(['id', 'tenant_id', 'created_by', 'updated_by', 'created_at', 'updated_at']);
    const tableFields = schema?.fields
      ?.filter((f: any) => !HIDDEN.has(f.name) && !['JSON', 'Text', 'Computed'].includes(f.dataType?.name))
      ?.slice(0, 7) || [];

    const totalPages = Math.ceil(total / 15);

    return (
      <div>
        {/* Baslik */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">{total} kayit</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> Yeni Ekle
          </button>
        </div>

        {/* Arama */}
        <div className="bg-white rounded-xl shadow-sm mb-4 p-3 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`${title} ara...`} className="flex-1 text-sm outline-none" />
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {tableFields.map((f: any) => (
                  <th key={f.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wide">
                    {fieldLabel(f.name)}
                  </th>
                ))}
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={tableFields.length + 1} className="px-4 py-16 text-center text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="font-medium">Kayit bulunamadi</p>
                  </td>
                </tr>
              ) : records.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer" onClick={() => openEdit(r)}>
                  {tableFields.map((f: any) => (
                    <td key={f.name} className="px-4 py-3">
                      {f.dataType?.name === 'Enum' || f.name === 'status' ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(String(r[f.name] || ''))}`}>
                          {statusLabel(String(r[f.name] || ''))}
                        </span>
                      ) : f.dataType?.name === 'Decimal' || f.dataType?.name === 'Money' ? (
                        <span className="font-mono text-sm">{formatValue(r[f.name], f.dataType.name)}</span>
                      ) : f.dataType?.name === 'Email' ? (
                        <span className="text-sm text-blue-600">{r[f.name] || '-'}</span>
                      ) : (
                        <span className="text-sm text-gray-700">{r[f.name] ?? '-'}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Sayfa {page} / {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // DETAY MODU (Studio FormEngine)
  // ============================================================
  if (!formSchema) return <div className="text-center py-12 text-gray-400">Schema yukleniyor...</div>;

  return (
    <div>
      {/* Geri butonu */}
      <button onClick={() => { setMode('list'); loadList(); }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> {title} Listesine Don
      </button>

      {/* Studio FormEngine render */}
      <FormEngine
        schema={formSchema}
        apiBase="/v1/data"
        data={selectedRecord}
        lines={selectedLines}
        onSave={handleSave}
        onAction={handleAction}
        onLookup={handleLookup}
        mode={selectedRecord?.id ? 'edit' : 'create'}
      />
    </div>
  );
}
