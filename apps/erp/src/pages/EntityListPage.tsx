/**
 * Profesyonel ERP Entity Listesi
 * =================================
 * Generic ama profesyonel gorunumlu entity CRUD sayfasi.
 */

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../stores/api';
import { fieldLabel, formatValue, statusColor, statusLabel, inputType } from '../lib/format';
import { Plus, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface FieldSchema {
  name: string;
  dataType: { name: string; params?: any[] };
  constraints?: any;
}

export function EntityListPage({ entityName, title }: { entityName: string; title: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [schema, setSchema] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadSchema(); }, [entityName]);
  useEffect(() => { loadData(); }, [entityName, page]);

  const loadSchema = () => {
    apiGet(`/v1/data/_meta/schema/${entityName}`).then(setSchema).catch(() => {});
  };

  const loadData = () => {
    apiGet(`/v1/data/${entityName}?page=${page}&limit=15`).then((d) => {
      setRecords(d.data || []);
      setTotal(d.total || 0);
    }).catch(() => setRecords([]));
  };

  // Gorunur alanlar - id, tenant_id, created_by gibi sistem alanlari gizle
  const HIDDEN = ['id', 'tenant_id', 'created_by', 'updated_by', 'created_at', 'updated_at'];
  const allFields: FieldSchema[] = schema?.fields?.filter(
    (f: FieldSchema) => !HIDDEN.includes(f.name) && f.dataType?.name !== 'Computed',
  ) || [];
  const tableFields = allFields.filter(
    (f) => !['JSON', 'Text'].includes(f.dataType?.name),
  ).slice(0, 7);
  const formFields = allFields;

  // Kaydet
  const save = async () => {
    if (editId) {
      await apiPut(`/v1/data/${entityName}/${editId}`, formData);
    } else {
      await apiPost(`/v1/data/${entityName}`, formData);
    }
    setShowForm(false);
    setFormData({});
    setEditId(null);
    loadData();
  };

  // Duzenle
  const edit = (record: any) => {
    setEditId(record.id);
    setFormData({ ...record });
    setShowForm(true);
  };

  // Sil
  const remove = async (id: string) => {
    if (!confirm('Bu kaydi silmek istediginize emin misiniz?')) return;
    await apiDelete(`/v1/data/${entityName}/${id}`);
    loadData();
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      {/* Baslik */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{total} kayit bulundu</p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({}); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Yeni Ekle
        </button>
      </div>

      {/* Arama */}
      <div className="bg-white rounded-xl shadow-sm mb-4 p-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={`${title} ara...`}
          className="flex-1 text-sm outline-none placeholder:text-gray-400"
        />
        <span className="text-xs text-gray-400">{records.length} / {total}</span>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {tableFields.map((f) => (
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
                <td colSpan={tableFields.length + 1} className="px-4 py-16 text-center">
                  <div className="text-gray-400">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="font-medium">Kayit bulunamadi</p>
                    <p className="text-xs mt-1">Yeni kayit eklemek icin "Yeni Ekle" butonunu kullanin</p>
                  </div>
                </td>
              </tr>
            ) : records.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                {tableFields.map((f) => (
                  <td key={f.name} className="px-4 py-3">
                    {renderCell(r[f.name], f)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => edit(r)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(r.id)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Sayfa {page} / {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && schema && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Baslik */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {editId ? `${title} Duzenle` : `Yeni ${title}`}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                {formFields.map((f) => (
                  <div key={f.name} className={f.dataType?.name === 'Text' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      {fieldLabel(f.name)}
                      {f.constraints?.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    {renderInput(f, formData, setFormData)}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
              <button onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                Iptal
              </button>
              <button onClick={save}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm">
                {editId ? 'Guncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Tablo hucresi render */
function renderCell(value: any, field: FieldSchema) {
  if (value == null || value === '') return <span className="text-gray-300">-</span>;

  const type = field.dataType?.name;

  // Status / Enum badge
  if (type === 'Enum' || field.name === 'status') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(String(value))}`}>
        {statusLabel(String(value))}
      </span>
    );
  }

  // Boolean
  if (type === 'Boolean') {
    return value ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Evet</span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Hayir</span>
    );
  }

  // Money / Decimal
  if (type === 'Decimal' || type === 'Money') {
    return <span className="font-mono text-sm">{formatValue(value, type)}</span>;
  }

  // Date
  if (type === 'Date' || type === 'DateTime') {
    return <span className="text-sm text-gray-600">{formatValue(value, type)}</span>;
  }

  // Email
  if (type === 'Email') {
    return <span className="text-sm text-blue-600">{String(value)}</span>;
  }

  return <span className="text-sm text-gray-700">{String(value)}</span>;
}

/** Form input render */
function renderInput(field: FieldSchema, formData: any, setFormData: (d: any) => void) {
  const type = field.dataType?.name;
  const value = formData[field.name] ?? '';
  const onChange = (v: any) => setFormData({ ...formData, [field.name]: v });

  const inputClass = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-colors';

  if (type === 'Enum' && field.constraints?.values) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Secin...</option>
        {field.constraints.values.map((v: string) => (
          <option key={v} value={v}>{statusLabel(v)}</option>
        ))}
      </select>
    );
  }

  if (type === 'Boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-sm text-gray-600">{value ? 'Aktif' : 'Pasif'}</span>
      </label>
    );
  }

  if (type === 'Text') {
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        rows={3} className={inputClass + ' resize-none'} />
    );
  }

  return (
    <input type={inputType(type)} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={fieldLabel(field.name)}
      className={inputClass} />
  );
}
