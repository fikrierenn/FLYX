/**
 * Workflow FSL Kod Uretici
 * =========================
 * React Flow node/edge yapisindan FSL workflow kodu uretir.
 * Visual tasarimdan birebir FSL ciktisi olusturur.
 */

import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNodeData } from './types';

export function generateWorkflowFSL(
  workflowName: string,
  triggerEntity: string,
  nodes: Node[],
  edges: Edge[],
): string {
  let fsl = `workflow ${workflowName} {\n`;
  fsl += `  trigger: on_create(${triggerEntity})\n\n`;
  fsl += `  steps {\n`;

  // Baslangic node'undan baslayarak akisi takip et
  const startNode = nodes.find((n) => (n.data as unknown as WorkflowNodeData).type === 'start');
  if (startNode) {
    const visited = new Set<string>();
    fsl += generateStepsFSL(startNode.id, nodes, edges, visited, 2);
  }

  fsl += `  }\n`;
  fsl += `}`;
  return fsl;
}

function generateStepsFSL(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  visited: Set<string>,
  indent: number,
): string {
  if (visited.has(nodeId)) return '';
  visited.add(nodeId);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return '';

  const data = node.data as unknown as WorkflowNodeData;
  const pad = '  '.repeat(indent);
  let fsl = '';

  switch (data.type) {
    case 'start':
      // Baslangic node'u FSL'de yazilmaz, sonraki node'a gec
      const nextFromStart = edges.find((e) => e.source === nodeId);
      if (nextFromStart) {
        fsl += generateStepsFSL(nextFromStart.target, nodes, edges, visited, indent);
      }
      break;

    case 'decision': {
      const stepName = data.label?.replace(/\s+/g, '_').toLowerCase() || 'check';
      fsl += `${pad}${stepName} {\n`;
      fsl += `${pad}  condition: ${data.condition || 'true'}\n\n`;

      // Evet (true) dali
      const trueEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'true');
      if (trueEdge) {
        fsl += `${pad}  if_true {\n`;
        fsl += generateStepsFSL(trueEdge.target, nodes, edges, visited, indent + 2);
        fsl += `${pad}  }\n\n`;
      }

      // Hayir (false) dali
      const falseEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'false');
      if (falseEdge) {
        fsl += `${pad}  if_false {\n`;
        fsl += generateStepsFSL(falseEdge.target, nodes, edges, visited, indent + 2);
        fsl += `${pad}  }\n`;
      }

      fsl += `${pad}}\n`;
      break;
    }

    case 'approval': {
      const stepName = data.label?.replace(/\s+/g, '_').toLowerCase() || 'approval';
      fsl += `${pad}${stepName} {\n`;
      if (data.assignee) fsl += `${pad}  assignee: "${data.assignee}"\n`;
      if (data.timeout) fsl += `${pad}  timeout: "${data.timeout}"\n`;
      fsl += `${pad}}\n`;

      // Sonraki node
      const nextEdge = edges.find((e) => e.source === nodeId);
      if (nextEdge) {
        fsl += generateStepsFSL(nextEdge.target, nodes, edges, visited, indent);
      }
      break;
    }

    case 'action': {
      if (data.actionType === 'send_email') {
        fsl += `${pad}send_email({\n`;
        fsl += `${pad}  to: this.customer.email,\n`;
        fsl += `${pad}  template: "${data.label?.toLowerCase().replace(/\s+/g, '_') || 'notification'}"\n`;
        fsl += `${pad}});\n`;
      } else {
        fsl += `${pad}// ${data.label || 'Aksiyon'}\n`;
      }

      const nextEdge = edges.find((e) => e.source === nodeId);
      if (nextEdge) {
        fsl += generateStepsFSL(nextEdge.target, nodes, edges, visited, indent);
      }
      break;
    }

    case 'wait': {
      fsl += `${pad}// Bekle: ${data.waitDuration || '1 hour'}\n`;
      const nextEdge = edges.find((e) => e.source === nodeId);
      if (nextEdge) {
        fsl += generateStepsFSL(nextEdge.target, nodes, edges, visited, indent);
      }
      break;
    }

    case 'end':
      // Bitis node'u FSL'de yazilmaz
      break;
  }

  return fsl;
}
