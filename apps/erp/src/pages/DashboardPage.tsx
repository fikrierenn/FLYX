import { useState, useEffect } from 'react';
import { apiGet } from '../stores/api';
import { ShoppingCart, Users, Package, DollarSign } from 'lucide-react';

export function DashboardPage() {
  const [stats, setStats] = useState({ orders: 0, customers: 0, products: 0 });

  useEffect(() => {
    Promise.all([
      apiGet('/v1/data/SalesOrder?limit=1').catch(() => ({ total: 0 })),
      apiGet('/v1/data/Customer?limit=1').catch(() => ({ total: 0 })),
      apiGet('/v1/data/Product?limit=1').catch(() => ({ total: 0 })),
    ]).then(([o, c, p]) => {
      setStats({ orders: o.total || 0, customers: c.total || 0, products: p.total || 0 });
    });
  }, []);

  const cards = [
    { label: 'Siparisler', value: stats.orders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Musteriler', value: stats.customers, icon: Users, color: 'bg-green-500' },
    { label: 'Urunler', value: stats.products, icon: Package, color: 'bg-purple-500' },
    { label: 'Ciro (TL)', value: '0', icon: DollarSign, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ana Sayfa</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`${c.color} p-3 rounded-lg`}>
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
