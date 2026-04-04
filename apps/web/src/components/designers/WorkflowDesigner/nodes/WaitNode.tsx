/**
 * Bekleme Node'u - Belirli bir sure bekle
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

export function WaitNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <div className="px-4 py-3 bg-orange-50 border-2 border-orange-400 rounded-lg shadow-md min-w-[120px]">
      <Handle type="target" position={Position.Top} className="!bg-orange-600 !w-3 !h-3" />
      <div className="text-[10px] text-orange-500 font-medium uppercase mb-1">Bekle</div>
      <div className="text-xs font-semibold text-orange-800">
        ⏱ {nodeData.waitDuration || '1 saat'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-600 !w-3 !h-3" />
    </div>
  );
}
