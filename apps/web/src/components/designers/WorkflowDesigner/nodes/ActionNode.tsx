/**
 * Aksiyon Node'u - Bir islem gerceklestirme
 * Email gonderme, kayit olusturma, guncelleme vb.
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

const ACTION_ICONS: Record<string, string> = {
  send_email: '📧',
  create_record: '➕',
  update_record: '✏️',
  custom: '⚙️',
};

export function ActionNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const icon = ACTION_ICONS[nodeData.actionType || 'custom'] || '⚙️';
  return (
    <div className="px-4 py-3 bg-purple-50 border-2 border-purple-400 rounded-lg shadow-md min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-600 !w-3 !h-3" />
      <div className="text-[10px] text-purple-500 font-medium uppercase mb-1">Aksiyon</div>
      <div className="text-xs font-semibold text-purple-800">
        {icon} {nodeData.label || 'Islem Yap'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-600 !w-3 !h-3" />
    </div>
  );
}
