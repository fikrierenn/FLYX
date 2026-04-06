/**
 * FLYX ERP - Tum ekranlar Studio FormEngine ile render edilir.
 * Hicbir entity-specific TSX yok - her sey FSL'den gelir.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudioPage } from './pages/StudioPage';

function ERPLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sales" element={<StudioPage entityName="SalesOrder" title="Satis Siparisi" linesEntity="SalesOrderItem" />} />
          <Route path="/customers" element={<StudioPage entityName="Customer" title="Musteri" />} />
          <Route path="/products" element={<StudioPage entityName="Product" title="Urun" />} />
          <Route path="/inventory" element={<StudioPage entityName="StockMovement" title="Stok Hareketi" linesEntity="StockMovementItem" />} />
          <Route path="/stock-balance" element={<StudioPage entityName="StockBalance" title="Stok Bakiyesi" />} />
          <Route path="/purchases" element={<StudioPage entityName="PurchaseOrder" title="Satinalma Siparisi" />} />
          <Route path="/invoices" element={<StudioPage entityName="JournalEntry" title="Muhasebe Fisi" />} />
          <Route path="/finance" element={<StudioPage entityName="Account" title="Hesap Plani" />} />
          <Route path="/suppliers" element={<StudioPage entityName="Supplier" title="Tedarikci" />} />
          <Route path="/employees" element={<StudioPage entityName="Employee" title="Calisan" />} />
          <Route path="/warehouses" element={<StudioPage entityName="Warehouse" title="Depo" />} />
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
