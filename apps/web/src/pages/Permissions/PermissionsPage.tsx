/**
 * Yetki Matrisi Sayfasi
 * =======================
 * Admin paneli - rol x entity x aksiyon matrisi.
 * Checkbox grid ile yetki atama/kaldirma.
 *
 * Gorunum:
 * ┌──────────────┬───────────────────┬───────────────────┬──────────
 * │              │    Customer       │     Product       │  ...
 * │  Rol         │ C   R   U   D    │ C   R   U   D    │
 * ├──────────────┼───────────────────┼───────────────────┼──────────
 * │ admin        │ ☑   ☑   ☑   ☑    │ ☑   ☑   ☑   ☑    │
 * │ manager      │ ☑   ☑   ☑   ☐    │ ☑   ☑   ☑   ☐    │
 * │ user         │ ☐   ☑   ☐   ☐    │ ☐   ☑   ☐   ☐    │
 * │ sales_rep    │ ☑   ☑   ☐   ☐    │ ☐   ☑   ☐   ☐    │
 * └──────────────┴───────────────────┴───────────────────┴──────────
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

type PermissionAction = 'create' | 'read' | 'update' | 'delete';
const ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete'];
const ACTION_LABELS: Record<PermissionAction, string> = {
  create: 'C', read: 'R', update: 'U', delete: 'D',
};

interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

interface MatrixData {
  roles: Role[];
  entities: string[];
  matrix: Record<string, Record<string, Record<PermissionAction, boolean>>>;
}

export function PermissionsPage() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const token = useAuthStore((s) => s.token);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => { fetchMatrix(); }, []);

  const fetchMatrix = async () => {
    try {
      const res = await fetch('/v1/roles/matrix', { headers });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error('Matris yuklenemedi', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (roleId: string, entity: string, action: PermissionAction) => {
    if (!data) return;
    const current = data.matrix[roleId]?.[entity]?.[action] ?? false;

    await fetch('/v1/roles/permissions', {
      method: 'PUT', headers,
      body: JSON.stringify({ role_id: roleId, entity, action, allowed: !current }),
    });

    // Iyimser guncelleme
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, matrix: { ...prev.matrix } };
      if (!next.matrix[roleId]) next.matrix[roleId] = {};
      if (!next.matrix[roleId][entity]) next.matrix[roleId][entity] = { create: false, read: false, update: false, delete: false };
      next.matrix[roleId][entity][action] = !current;
      return next;
    });
  };

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    await fetch('/v1/roles', {
      method: 'POST', headers,
      body: JSON.stringify({ name: newRoleName.trim(), description: newRoleDesc.trim() }),
    });
    setNewRoleName('');
    setNewRoleDesc('');
    fetchMatrix();
  };

  const deleteRole = async (id: string) => {
    await fetch(`/v1/roles/${id}`, { method: 'DELETE', headers });
    fetchMatrix();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Yukleniyor...</div>;
  if (!data) return <div className="text-center py-12 text-red-500">Matris yuklenemedi</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Yetki Matrisi</h1>
          <p className="text-sm text-gray-500 mt-1">Rol bazinda entity erisim yetkileri</p>
        </div>
      </div>

      {/* Yeni Rol Ekleme */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Rol Adi</label>
          <input
            value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="ornek: warehouse_manager"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Aciklama</label>
          <input
            value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)}
            placeholder="Depo yoneticisi"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button onClick={createRole}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
          + Rol Ekle
        </button>
      </div>

      {/* Matris Tablosu */}
      {data.entities.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">🔐</div>
          <p>Henuz entity kaydedilmemis. Yetki matrisi entity kayit edildikten sonra gorunur.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 min-w-[180px]">
                  Rol
                </th>
                {data.entities.map((entity) => (
                  <th key={entity} colSpan={4} className="px-2 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-l border-gray-200">
                    {entity}
                  </th>
                ))}
                <th className="px-2 py-3 w-16"></th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 bg-gray-50"></th>
                {data.entities.map((entity) =>
                  ACTIONS.map((action) => (
                    <th key={`${entity}-${action}`}
                      className="px-1 py-1 text-center text-[10px] font-medium text-gray-500 border-l border-gray-100 first:border-l-gray-200"
                      title={`${entity}.${action}`}>
                      {ACTION_LABELS[action]}
                    </th>
                  ))
                )}
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 sticky left-0 bg-white">
                    <div className="font-medium text-gray-800">{role.name}</div>
                    <div className="text-[10px] text-gray-400">{role.description}</div>
                  </td>
                  {data.entities.map((entity) =>
                    ACTIONS.map((action) => (
                      <td key={`${role.id}-${entity}-${action}`} className="text-center border-l border-gray-100 first:border-l-gray-200">
                        <input
                          type="checkbox"
                          checked={data.matrix[role.id]?.[entity]?.[action] ?? false}
                          onChange={() => togglePermission(role.id, entity, action)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={role.name === 'admin'}
                          title={`${role.name} → ${entity}.${action}`}
                        />
                      </td>
                    ))
                  )}
                  <td className="px-2 text-center">
                    {!role.is_system && (
                      <button onClick={() => deleteRole(role.id)}
                        className="text-red-400 hover:text-red-600 text-xs">
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
