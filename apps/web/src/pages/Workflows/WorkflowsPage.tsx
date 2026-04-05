/**
 * Workflows Sayfasi
 * ==================
 * Gorsel workflow tasarimcisini iceren sayfa.
 */

import { WorkflowDesigner } from '../../components/designers/WorkflowDesigner/WorkflowDesigner';

export function WorkflowsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Workflow Designer</h1>
      <WorkflowDesigner />
    </div>
  );
}
