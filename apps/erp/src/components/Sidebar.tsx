import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, Package, Truck,
  Warehouse, FileText, DollarSign, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../stores/auth';

const MENU = [
  { path: '/', label: 'Ana Sayfa', icon: LayoutDashboard },
  { group: 'Satis' },
  { path: '/sales', label: 'Siparisler', icon: ShoppingCart },
  { path: '/customers', label: 'Musteriler', icon: Users },
  { group: 'Stok & Depo' },
  { path: '/products', label: 'Urunler', icon: Package },
  { path: '/inventory', label: 'Stok Hareketleri', icon: Warehouse },
  { path: '/stock-balance', label: 'Stok Bakiyesi', icon: Package },
  { path: '/warehouses', label: 'Depolar', icon: Warehouse },
  { group: 'Satinalma' },
  { path: '/purchases', label: 'Satinalma Siparisleri', icon: Truck },
  { path: '/suppliers', label: 'Tedarikciler', icon: Users },
  { group: 'Finans & IK' },
  { path: '/invoices', label: 'Muhasebe Fisleri', icon: FileText },
  { path: '/finance', label: 'Hesap Plani', icon: DollarSign },
  { path: '/employees', label: 'Calisanlar', icon: Users },
] as any[];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="w-56 bg-slate-900 text-slate-300 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">FLYX ERP</h1>
        <p className="text-[10px] text-slate-500 mt-0.5">Enterprise Resource Planning</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-1 overflow-y-auto">
        {MENU.map((item: any, idx: number) => {
          // Grup basligi
          if (item.group) {
            return (
              <div key={`g-${idx}`} className="px-4 pt-4 pb-1">
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{item.group}</span>
              </div>
            );
          }

          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all ${
                active
                  ? 'bg-blue-600/90 text-white rounded-r-lg ml-0 mr-2 shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Alt */}
      <div className="border-t border-slate-700 p-3">
        <div className="text-xs text-slate-500 mb-2">{user?.email || 'Kullanici'}</div>
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-400 hover:text-white rounded"
        >
          <Settings className="w-3.5 h-3.5" /> Ayarlar
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 rounded"
        >
          <LogOut className="w-3.5 h-3.5" /> Cikis Yap
        </button>
      </div>
    </div>
  );
}
