/**
 * FLYX Platform - Ana Uygulama Bileşeni
 * =======================================
 * React Router ile sayfa yönlendirmeleri ve üst navigasyon çubuğu.
 *
 * Sayfalar:
 * - / → Dashboard (istatistik kartları)
 * - /entities → Entity Designer (FSL editörü)
 * - /forms → Form Designer (sürükle-bırak form oluşturucu)
 * - /workflows → Workflow Designer (görsel iş akışı tasarımcısı)
 * - /reports → Report Designer (görsel rapor tasarımcısı)
 */

import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { EntitiesPage } from './pages/Entities/EntitiesPage';
import { FormsPage } from './pages/Forms/FormsPage';
import { WorkflowsPage } from './pages/Workflows/WorkflowsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';

export function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-600">FLYX Platform</h1>
          <div className="flex gap-1">
            <a href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Dashboard</a>
            <a href="/entities" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Entities</a>
            <a href="/forms" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Forms</a>
            <a href="/workflows" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Workflows</a>
            <a href="/reports" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Reports</a>
          </div>
        </div>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/entities" element={<EntitiesPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}
