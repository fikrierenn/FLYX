/**
 * FLYX Platform - Ana Uygulama Bileseni
 * =======================================
 * Auth durumuna gore Login veya Dashboard gosterir.
 * Giris yapmamis kullanici LoginPage'e yonlendirilir.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { EntitiesPage } from './pages/Entities/EntitiesPage';
import { FormsPage } from './pages/Forms/FormsPage';
import { WorkflowsPage } from './pages/Workflows/WorkflowsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { UsersPage } from './pages/Users/UsersPage';
import { PermissionsPage } from './pages/Permissions/PermissionsPage';

function ProtectedLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-600">FLYX Platform</h1>
          <div className="flex items-center gap-1">
            <a href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Dashboard</a>
            <a href="/entities" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Entities</a>
            <a href="/forms" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Forms</a>
            <a href="/workflows" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Workflows</a>
            <a href="/reports" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Reports</a>
            {user?.roles?.includes('admin') && (
              <>
                <a href="/users" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Users</a>
                <a href="/permissions" className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">Yetkiler</a>
              </>
            )}
            <div className="w-px h-5 bg-gray-300 mx-2" />
            <span className="text-xs text-gray-500">{user?.email}</span>
            <button onClick={logout} className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
              Cikis
            </button>
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
          <Route path="/users" element={<UsersPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
}
