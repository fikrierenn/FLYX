import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EntityListPage } from './pages/EntityListPage';

function ERPLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sales" element={<EntityListPage entityName="SalesOrder" title="Satis Siparisi" />} />
          <Route path="/customers" element={<EntityListPage entityName="Customer" title="Musteri" />} />
          <Route path="/products" element={<EntityListPage entityName="Product" title="Urun" />} />
          <Route path="/inventory" element={<EntityListPage entityName="StockMovement" title="Stok Hareketi" />} />
          <Route path="/purchases" element={<EntityListPage entityName="PurchaseOrder" title="Satinalma Siparisi" />} />
          <Route path="/invoices" element={<EntityListPage entityName="JournalEntry" title="Muhasebe Fisi" />} />
          <Route path="/finance" element={<EntityListPage entityName="Account" title="Hesap Plani" />} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  const isAuth = useAuth((s) => s.isAuth);

  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/*" element={isAuth ? <ERPLayout /> : <Navigate to="/login" />} />
    </Routes>
  );
}
