/**
 * Reports Sayfasi
 * ================
 * Gorsel rapor tasarimcisini iceren sayfa.
 */

import { ReportDesigner } from '../../components/designers/ReportDesigner/ReportDesigner';

export function ReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Report Designer</h1>
      <ReportDesigner />
    </div>
  );
}
