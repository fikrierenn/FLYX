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
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">FLYX Platform</h1>
          <div className="flex gap-4">
            <a href="/" className="text-gray-600 hover:text-primary-600">Dashboard</a>
            <a href="/entities" className="text-gray-600 hover:text-primary-600">Entities</a>
            <a href="/forms" className="text-gray-600 hover:text-primary-600">Forms</a>
            <a href="/workflows" className="text-gray-600 hover:text-primary-600">Workflows</a>
            <a href="/reports" className="text-gray-600 hover:text-primary-600">Reports</a>
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
