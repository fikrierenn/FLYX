/**
 * Generic Entity Liste Sayfasi
 * ==============================
 * API'den entity schema + data cekip tablo gosterir.
 * Tum entity'ler icin kullanilir (Customer, Product, Supplier vs.)
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../stores/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function EntityListPage({ entityName, title }: { entityName: string; title: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [schema, setSchema] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { load(); }, [entityName]);

  const load = () => {
    apiGet(`/v1/data/_meta/schema/${entityName}`).then(setSchema).catch(() => {});
    apiGet(`/v1/data/${entityName}?limit=50`).then((d) => {
      setRecords(d.data || []);
      setTotal(d.total || 0);
    }).catch(() => setRecords([]));
  };

  const visibleFields = schema?.fields?.filter(
    (f: any) => !['JSON', 'Text', 'Computed'].includes(f.dataType?.name),
  )?.slice(0, 6) || [];

  const save = async () => {
    if (editId) {
      // TODO: update
    } else {
      await apiPost(`/v1/data/${entityName}`, formData);
    }
    setShowForm(false);
    setFormData({});
    load();
  };

  const remove = async (id: string) => {
    await apiDelete(`/v1/data/${entityName}/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">{total} kayit</p>
        </div>
        <button onClick={() => { setEditId(null); setFormData({}); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Yeni {title}
        </button>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {visibleFields.map((f: any) => (
                <th key={f.name} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{f.name}</th>
              ))}
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 ? (
              <tr><td colSpan={visibleFields.length + 1} className="px-4 py-12 text-center text-gray-400">Kayit yok</td></tr>
            ) : records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                {visibleFields.map((f: any) => (
                  <td key={f.name} className="px-4 py-3 text-gray-700">{formatVal(r[f.name], f.dataType?.name)}</td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni Kayit Modal */}
      {showForm && schema && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Yeni {title}</h2>
            <div className="space-y-3">
              {schema.fields.filter((f: any) => f.dataType?.name !== 'Computed').map((f: any) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.name}</label>
                  {f.dataType?.name === 'Enum' && f.constraints?.values ? (
                    <select value={formData[f.name] || ''} onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Secin...</option>
                      {f.constraints.values.map((v: string) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ) : f.dataType?.name === 'Boolean' ? (
                    <input type="checkbox" checked={formData[f.name] || false}
                      onChange={(e) => setFormData({ ...formData, [f.name]: e.target.checked })} />
                  ) : (
                    <input type={inputType(f.dataType?.name)} value={formData[f.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Iptal</button>
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputType(dt: string) {
  const m: Record<string, string> = { Email: 'email', Phone: 'tel', Number: 'number', Decimal: 'number', Money: 'number', Date: 'date', DateTime: 'datetime-local' };
  return m[dt] || 'text';
}

function formatVal(v: any, type: string) {
  if (v == null) return '-';
  if (type === 'Boolean') return v ? 'Evet' : 'Hayir';
  if (type === 'Decimal' || type === 'Money') return Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  return String(v);
}
