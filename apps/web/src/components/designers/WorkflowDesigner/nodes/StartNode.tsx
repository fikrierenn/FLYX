/**
 * Baslangic Node'u - Workflow'un giris noktasi
 * on_create(Entity) tetikleyicisine karsilik gelir.
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

export function StartNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <div className="px-4 py-2 bg-green-500 text-white rounded-full text-xs font-medium shadow-md min-w-[100px] text-center">
      <div>{nodeData.label || 'Baslangic'}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-700 !w-3 !h-3" />
    </div>
  );
}
