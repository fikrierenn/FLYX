/**
 * Workflow Visual Designer - Gorsel Is Akisi Tasarimcisi
 * =======================================================
 * React Flow ile surukleme-birakma tabanli workflow tasarimi.
 *
 * Duzen:
 * ┌──────────┬───────────────────────────┬──────────┐
 * │ Node     │ React Flow Canvas         │ Property │
 * │ Toolbox  │ (surukleme alani)         │ Panel    │
 * │          │                           │          │
 * │ Start    │  [Start] → [Decision]     │ Secili   │
 * │ Decision │            ↙     ↘        │ node     │
 * │ Approval │     [Approve] [Reject]    │ ozellikleri│
 * │ Action   │         ↘     ↙           │          │
 * │ Wait     │          [End]            │          │
 * │ End      │                           │          │
 * ├──────────┴───────────────────────────┴──────────┤
 * │ FSL Kod Onizleme                                │
 * └─────────────────────────────────────────────────┘
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StartNode, EndNode, DecisionNode, ApprovalNode, ActionNode, WaitNode } from './nodes';
import { WorkflowPropertyPanel } from './WorkflowPropertyPanel';
import { generateWorkflowFSL } from './generateWorkflowFSL';
import type { WorkflowNodeData, WorkflowNodeType } from './types';

// Ozel node tipleri kaydi
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  approval: ApprovalNode,
  action: ActionNode,
  wait: WaitNode,
};

// Varsayilan workflow - ornek baslangic
const DEFAULT_NODES: Node[] = [
  { id: 'start-1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Baslangic', type: 'start' } },
  { id: 'end-1', type: 'end', position: { x: 250, y: 400 }, data: { label: 'Bitis', type: 'end' } },
];

const DEFAULT_EDGES: Edge[] = [];

// Toolbox'taki node tipleri
const NODE_TOOLBOX: { type: WorkflowNodeType; label: string; icon: string; color: string }[] = [
  { type: 'start', label: 'Baslangic', icon: '▶', color: 'bg-green-100 text-green-700' },
  { type: 'decision', label: 'Karar', icon: '◆', color: 'bg-yellow-100 text-yellow-700' },
  { type: 'approval', label: 'Onay', icon: '✓', color: 'bg-blue-100 text-blue-700' },
  { type: 'action', label: 'Aksiyon', icon: '⚡', color: 'bg-purple-100 text-purple-700' },
  { type: 'wait', label: 'Bekle', icon: '⏱', color: 'bg-orange-100 text-orange-700' },
  { type: 'end', label: 'Bitis', icon: '⏹', color: 'bg-red-100 text-red-700' },
];

export function WorkflowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(DEFAULT_EDGES);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('InvoiceApproval');
  const [triggerEntity, setTriggerEntity] = useState('Invoice');

  // Yeni baglanti ekleme
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
    [setEdges],
  );

  // Node secimi
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Canvas bos alana tiklandiginda secimi kaldir
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Toolbox'tan yeni node ekleme
  const addNode = useCallback((type: WorkflowNodeType) => {
    const id = `${type}-${Date.now()}`;
    const defaultLabels: Record<WorkflowNodeType, string> = {
      start: 'Baslangic', end: 'Bitis', decision: 'Kontrol',
      approval: 'Onay Bekle', action: 'Islem Yap', wait: 'Bekle',
    };

    const newNode: Node = {
      id,
      type,
      position: { x: 200 + Math.random() * 100, y: 100 + Math.random() * 200 },
      data: { label: defaultLabels[type], type } satisfies WorkflowNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
  }, [setNodes]);

  // Secili node ozelliklerini guncelle
  const updateNodeData = useCallback((id: string, updates: Partial<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n)),
    );
    setSelectedNode((prev) => prev?.id === id ? { ...prev, data: { ...prev.data, ...updates } } : prev);
  }, [setNodes]);

  // FSL kod uretimi
  const fslCode = useMemo(
    () => generateWorkflowFSL(workflowName, triggerEntity, nodes, edges),
    [workflowName, triggerEntity, nodes, edges],
  );

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
      {/* Sol: Node Toolbox */}
      <div className="col-span-2 bg-white rounded-lg shadow p-4 overflow-y-auto border-r border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Adimlar</h3>
        <div className="space-y-2">
          {NODE_TOOLBOX.map((item) => (
            <button
              key={item.type}
              onClick={() => addNode(item.type)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${item.color} hover:opacity-80`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Workflow ayarlari */}
        <div className="mt-6 pt-4 border-t space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workflow</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Isim</label>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tetikleyici Entity</label>
            <input
              value={triggerEntity}
              onChange={(e) => setTriggerEntity(e.target.value)}
              className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Orta: React Flow Canvas */}
      <div className="col-span-7 bg-gray-50 rounded-lg shadow overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-50"
        >
          <Controls position="bottom-left" />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#ddd" />
        </ReactFlow>
      </div>

      {/* Sag: Property Panel */}
      <div className="col-span-3 bg-white rounded-lg shadow p-4 overflow-y-auto border-l border-gray-200">
        <WorkflowPropertyPanel selectedNode={selectedNode} onUpdateNode={updateNodeData} />
      </div>

      {/* Alt: FSL Kod Onizleme */}
      <div className="col-span-12 bg-gray-900 rounded-lg shadow p-4 max-h-[200px] overflow-auto border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Uretilen FSL Kodu</span>
          <button
            onClick={() => navigator.clipboard.writeText(fslCode)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Kopyala
          </button>
        </div>
        <pre className="text-green-400 text-sm font-mono">{fslCode}</pre>
      </div>
    </div>
  );
}
