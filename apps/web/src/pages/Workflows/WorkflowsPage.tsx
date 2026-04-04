/**
 * Workflows Sayfasi
 * ==================
 * Gorsel workflow tasarimcisini iceren sayfa.
 */

import { WorkflowDesigner } from '../../components/designers/WorkflowDesigner/WorkflowDesigner';

export function WorkflowsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Workflow Designer</h2>
      <WorkflowDesigner />
    </div>
  );
}
