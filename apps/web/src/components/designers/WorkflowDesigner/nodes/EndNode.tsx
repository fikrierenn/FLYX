/**
 * Bitis Node'u - Workflow'un cikis noktasi
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

export function EndNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <div className="px-4 py-2 bg-red-500 text-white rounded-full text-xs font-medium shadow-md min-w-[100px] text-center">
      <Handle type="target" position={Position.Top} className="!bg-red-700 !w-3 !h-3" />
      <div>{nodeData.label || 'Bitis'}</div>
    </div>
  );
}
