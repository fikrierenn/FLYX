/**
 * Karar Node'u - Kosullu dallanma
 * FSL'deki decision step'e karsilik gelir.
 * Iki cikis: Evet (true) ve Hayir (false)
 */

import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';

export function DecisionNode({ data }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-yellow-700 !w-3 !h-3" />
      {/* Baklavadilim (diamond) seklinde karar kutusu */}
      <div className="w-36 h-20 bg-yellow-400 shadow-md flex items-center justify-center"
        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
        <div className="text-xs font-medium text-yellow-900 text-center px-4 max-w-[90px] truncate">
          {nodeData.condition || 'Kosul?'}
        </div>
      </div>
      {/* Sol cikis: Hayir */}
      <Handle type="source" position={Position.Left} id="false"
        className="!bg-red-500 !w-3 !h-3" style={{ top: '50%' }} />
      {/* Sag cikis: Evet */}
      <Handle type="source" position={Position.Right} id="true"
        className="!bg-green-500 !w-3 !h-3" style={{ top: '50%' }} />
      {/* Etiketler */}
      <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-[9px] text-red-600 font-medium">Hayir</span>
      <span className="absolute -right-6 top-1/2 -translate-y-1/2 text-[9px] text-green-600 font-medium">Evet</span>
    </div>
  );
}
