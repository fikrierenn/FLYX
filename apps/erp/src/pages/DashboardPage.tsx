import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../stores/api';
import { ShoppingCart, Users, Package, DollarSign, Warehouse, Truck, TrendingUp, Clock } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({ orders: 0, customers: 0, products: 0, movements: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      apiGet('/v1/data/SalesOrder?limit=1').catch(() => ({ total: 0 })),
      apiGet('/v1/data/Customer?limit=1').catch(() => ({ total: 0 })),
      apiGet('/v1/data/Product?limit=1').catch(() => ({ total: 0 })),
      apiGet('/v1/data/StockMovement?limit=1').catch(() => ({ total: 0 })),
    ]).then(([o, c, p, m]) => {
      setStats({
        orders: o.total || 0,
        customers: c.total || 0,
        products: p.total || 0,
        movements: m.total || 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Satis Siparisleri', value: stats.orders, icon: ShoppingCart, color: 'from-blue-500 to-blue-600', path: '/sales' },
    { label: 'Musteriler', value: stats.customers, icon: Users, color: 'from-emerald-500 to-emerald-600', path: '/customers' },
    { label: 'Urunler', value: stats.products, icon: Package, color: 'from-violet-500 to-violet-600', path: '/products' },
    { label: 'Stok Hareketleri', value: stats.movements, icon: Warehouse, color: 'from-amber-500 to-amber-600', path: '/inventory' },
  ];

  const shortcuts = [
    { label: 'Yeni Siparis', icon: ShoppingCart, path: '/sales', color: 'text-blue-600 bg-blue-50' },
    { label: 'Yeni Musteri', icon: Users, path: '/customers', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Stok Girisi', icon: TrendingUp, path: '/inventory', color: 'text-amber-600 bg-amber-50' },
    { label: 'Satinalma', icon: Truck, path: '/purchases', color: 'text-violet-600 bg-violet-50' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ana Sayfa</h1>
          <p className="text-sm text-gray-500 mt-1">Hosgeldiniz, bugunun ozeti</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Istatistik Kartlari */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {cards.map((c) => (
          <div key={c.label} onClick={() => navigate(c.path)}
            className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 font-medium">{c.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{c.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${c.color} group-hover:scale-110 transition-transform`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hizli Islemler */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Hizli Islemler</h2>
        <div className="grid grid-cols-4 gap-4">
          {shortcuts.map((s) => (
            <button key={s.label} onClick={() => navigate(s.path)}
              className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left">
              <div className={`p-2.5 rounded-lg ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
