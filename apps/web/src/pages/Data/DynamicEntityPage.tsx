/**
 * Dinamik Entity Sayfasi
 * ========================
 * Runtime'dan yuklenen entity'ler icin otomatik CRUD arayuzu.
 * Sol panelde entity listesi, sagda secili entity'nin kayitlari.
 * Tum veriler /v1/data/:entity API'sinden gelir.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface EntityField {
  name: string;
  dataType: { name: string; params?: any[] };
  constraints?: Record<string, any>;
}

interface EntitySchema {
  name: string;
  tableName: string;
  fields: EntityField[];
}

export function DynamicEntityPage() {
  const [entities, setEntities] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [schema, setSchema] = useState<EntitySchema | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const token = useAuthStore((s) => s.token);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Entity listesini yukle
  useEffect(() => {
    fetch('/v1/data/_meta/entities', { headers })
      .then((r) => r.json())
      .then((data) => {
        setEntities(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedEntity) setSelectedEntity(data[0]);
      })
      .catch(() => {});
  }, []);

  // Secili entity degistiginde schema + kayitlari yukle
  useEffect(() => {
    if (!selectedEntity) return;

    // Schema
    fetch(`/v1/data/_meta/schema/${selectedEntity}`, { headers })
      .then((r) => r.json())
      .then((data) => setSchema(data))
      .catch(() => {});

    // Kayitlar
    loadRecords();
  }, [selectedEntity]);

  const loadRecords = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    try {
      const res = await fetch(`/v1/data/${selectedEntity}?limit=50`, { headers });
      const data = await res.json();
      setRecords(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditRecord(null);
    setFormData({});
    setShowForm(true);
  };

  const openEditForm = (record: any) => {
    setEditRecord(record);
    setFormData({ ...record });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!selectedEntity) return;
    const method = editRecord ? 'PUT' : 'POST';
    const url = editRecord
      ? `/v1/data/${selectedEntity}/${editRecord.id}`
      : `/v1/data/${selectedEntity}`;

    await fetch(url, { method, headers, body: JSON.stringify(formData) });
    setShowForm(false);
    loadRecords();
  };

  const handleDelete = async (id: string) => {
    if (!selectedEntity) return;
    await fetch(`/v1/data/${selectedEntity}/${id}`, { method: 'DELETE', headers });
    loadRecords();
  };

  // Gorunur alanlar (JSON, Text, Computed haric)
  const visibleFields = schema?.fields.filter(
    (f) => !['JSON', 'Text', 'Computed'].includes(f.dataType.name),
  ) || [];

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sol Panel - Entity Listesi */}
      <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-3 border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entities</h3>
        </div>
        {entities.length === 0 ? (
          <div className="p-4 text-xs text-gray-400 text-center">
            Yuklenen entity yok.<br />FSL modulleri ile entity tanimlayın.
          </div>
        ) : (
          entities.map((e) => (
            <button
              key={e}
              onClick={() => setSelectedEntity(e)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 ${
                selectedEntity === e
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {e}
            </button>
          ))
        )}
      </div>

      {/* Sag Panel - Kayitlar */}
      <div className="flex-1 overflow-auto p-6">
        {!selectedEntity ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sol panelden bir entity secin
          </div>
        ) : (
          <>
            {/* Baslik */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{selectedEntity}</h1>
                <p className="text-sm text-gray-500">{total} kayit</p>
              </div>
              <button
                onClick={openCreateForm}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                + Yeni {selectedEntity}
              </button>
            </div>

            {/* Tablo */}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Yukleniyor...</div>
            ) : records.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p>Henuz kayit yok</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {visibleFields.slice(0, 6).map((f) => (
                        <th key={f.name} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {f.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Islem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        {visibleFields.slice(0, 6).map((f) => (
                          <td key={f.name} className="px-4 py-3 text-gray-700">
                            {formatCell(record[f.name], f.dataType.name)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => openEditForm(record)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">Duzenle</button>
                          <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-800 text-xs">Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      {showForm && schema && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editRecord ? `${selectedEntity} Duzenle` : `Yeni ${selectedEntity}`}
            </h2>
            <div className="space-y-3">
              {schema.fields
                .filter((f) => f.dataType.name !== 'Computed')
                .map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.name} {f.constraints?.required && <span className="text-red-500">*</span>}
                    </label>
                    {f.dataType.name === 'Boolean' ? (
                      <input
                        type="checkbox"
                        checked={formData[f.name] || false}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                    ) : f.dataType.name === 'Text' ? (
                      <textarea
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                      />
                    ) : f.dataType.name === 'Enum' && f.constraints?.values ? (
                      <select
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Secin...</option>
                        {f.constraints.values.map((v: string) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={inputType(f.dataType.name)}
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [f.name]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                Iptal
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputType(dt: string): string {
  const map: Record<string, string> = {
    Email: 'email', Phone: 'tel', URL: 'url',
    Number: 'number', Decimal: 'number', Money: 'number',
    Date: 'date', DateTime: 'datetime-local',
  };
  return map[dt] || 'text';
}

function formatCell(value: any, type: string): string {
  if (value === null || value === undefined) return '-';
  if (type === 'Boolean') return value ? 'Evet' : 'Hayir';
  if (type === 'Decimal' || type === 'Money') return Number(value).toLocaleString('tr-TR');
  return String(value);
}
