/**
 * Workflow Property Panel
 * ========================
 * Secili node'un ozelliklerini duzenleme paneli.
 * Node tipine gore farkli form alanlari gosterir.
 */

import React from 'react';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData } from './types';

interface WorkflowPropertyPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: Partial<WorkflowNodeData>) => void;
}

export function WorkflowPropertyPanel({ selectedNode, onUpdateNode }: WorkflowPropertyPanelProps) {
  if (!selectedNode) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        Ozelliklerini duzenlemek icin bir adim secin
      </div>
    );
  }

  const data = selectedNode.data as unknown as WorkflowNodeData;
  const update = (field: string, value: string) => {
    onUpdateNode(selectedNode.id, { [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {data.type === 'decision' ? 'Karar' :
         data.type === 'approval' ? 'Onay' :
         data.type === 'action' ? 'Aksiyon' :
         data.type === 'wait' ? 'Bekleme' :
         data.type === 'start' ? 'Baslangic' : 'Bitis'} Ozellikleri
      </h3>

      {/* Etiket - tum node'lar */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Etiket</label>
        <input
          value={data.label || ''}
          onChange={(e) => update('label', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Decision: kosul */}
      {data.type === 'decision' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Kosul (FSL ifadesi)</label>
          <input
            value={data.condition || ''}
            onChange={(e) => update('condition', e.target.value)}
            placeholder="this.total > 10000"
            className="w-full px-3 py-1.5 text-sm border rounded font-mono focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* Approval: atanan kisi + zaman asimi */}
      {data.type === 'approval' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Atanan Kisi/Rol</label>
            <input
              value={data.assignee || ''}
              onChange={(e) => update('assignee', e.target.value)}
              placeholder="finance_director"
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zaman Asimi</label>
            <input
              value={data.timeout || ''}
              onChange={(e) => update('timeout', e.target.value)}
              placeholder="2 days"
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </>
      )}

      {/* Action: islem turu */}
      {data.type === 'action' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Islem Turu</label>
            <select
              value={data.actionType || 'custom'}
              onChange={(e) => update('actionType', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="send_email">Email Gonder</option>
              <option value="create_record">Kayit Olustur</option>
              <option value="update_record">Kayit Guncelle</option>
              <option value="custom">Ozel</option>
            </select>
          </div>
        </>
      )}

      {/* Wait: bekleme suresi */}
      {data.type === 'wait' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bekleme Suresi</label>
          <input
            value={data.waitDuration || ''}
            onChange={(e) => update('waitDuration', e.target.value)}
            placeholder="1 hour"
            className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* Node ID (readonly) */}
      <div className="pt-2 border-t">
        <span className="text-[10px] text-gray-400">ID: {selectedNode.id}</span>
      </div>
    </div>
  );
}
