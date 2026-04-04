/**
 * Onay Node'u - Bir kisiden/rolden onay bekleme
 * FSL'deki approval step'e karsilik gelir.
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

export function ApprovalNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <div className="px-4 py-3 bg-blue-50 border-2 border-blue-400 rounded-lg shadow-md min-w-[140px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-600 !w-3 !h-3" />
      <div className="text-[10px] text-blue-500 font-medium uppercase mb-1">Onay</div>
      <div className="text-xs font-semibold text-blue-800">{nodeData.label || 'Onay Bekle'}</div>
      {nodeData.assignee && (
        <div className="text-[10px] text-blue-600 mt-1">👤 {nodeData.assignee}</div>
      )}
      {nodeData.timeout && (
        <div className="text-[10px] text-blue-400 mt-0.5">⏱ {nodeData.timeout}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-600 !w-3 !h-3" />
    </div>
  );
}
