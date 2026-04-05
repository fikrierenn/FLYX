/**
 * Satis Siparisi ERP Ekrani
 * ===========================
 * Gercek ERP siparis ekrani - platform tasarimcisindan bagimsiz.
 *
 * Sol: Siparis listesi (son siparisler)
 * Sag: Siparis detay (master-detail)
 *   Ust: Baslik bilgileri (musteri, tarih, durum)
 *   Orta: Kalem tablosu (urun, miktar, fiyat, KDV, toplam)
 *   Alt: Toplamlar + durum butonlari
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface OrderHeader {
  id?: string;
  order_no?: string;
  customer_id: string;
  customer_name?: string;
  order_date: string;
  delivery_date?: string;
  currency: string;
  status?: string;
  notes?: string;
  subtotal?: number;
  tax_amount?: number;
  total?: number;
}

interface OrderLine {
  id?: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  tax_rate: number;
  line_total: number;
  discount_amount: number;
  tax_amount: number;
  net_total: number;
}

interface Customer { id: string; code: string; name: string; }
interface Product { id: string; code: string; name: string; sale_price: number; tax_rate: number; }

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  confirmed: 'Onaylandi',
  shipped: 'Sevk Edildi',
  delivered: 'Teslim Edildi',
  cancelled: 'Iptal',
};

export function SalesOrderPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderHeader | null>(null);
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isNew, setIsNew] = useState(false);
  const token = useAuthStore((s) => s.token);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Siparis listesini yukle
  useEffect(() => {
    fetch('/v1/sales/orders', { headers }).then((r) => r.json()).then((d) => setOrders(d.data || [])).catch(() => {});
    fetch('/v1/sales/lookup/customers', { headers }).then((r) => r.json()).then((d) => setCustomers(d || [])).catch(() => {});
    fetch('/v1/sales/lookup/products', { headers }).then((r) => r.json()).then((d) => setProducts(d || [])).catch(() => {});
  }, []);

  // Secili siparisi yukle
  useEffect(() => {
    if (!selectedOrderId || isNew) return;
    fetch(`/v1/sales/orders/${selectedOrderId}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        setLines(d.lines || []);
      }).catch(() => {});
  }, [selectedOrderId]);

  // Yeni siparis
  const newOrder = () => {
    setIsNew(true);
    setSelectedOrderId(null);
    setOrder({
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      currency: 'TRY',
      status: 'draft',
    });
    setLines([]);
  };

  // Satir ekle
  const addLine = () => {
    setLines([...lines, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount_rate: 0,
      tax_rate: 18,
      line_total: 0,
      discount_amount: 0,
      tax_amount: 0,
      net_total: 0,
    }]);
  };

  // Satir hesapla
  const calculateLine = useCallback((line: OrderLine): OrderLine => {
    const lineTotal = line.quantity * line.unit_price;
    const discountAmount = lineTotal * line.discount_rate / 100;
    const afterDiscount = lineTotal - discountAmount;
    const taxAmount = afterDiscount * line.tax_rate / 100;
    const netTotal = afterDiscount + taxAmount;
    return {
      ...line,
      line_total: Math.round(lineTotal * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      net_total: Math.round(netTotal * 100) / 100,
    };
  }, []);

  // Satir guncelle
  const updateLine = (index: number, field: string, value: any) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;

    // Urun secildiginde fiyat ve KDV otomatik gelsin
    if (field === 'product_id') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].product_name = product.name;
        updated[index].product_code = product.code;
        updated[index].unit_price = Number(product.sale_price) || 0;
        updated[index].tax_rate = Number(product.tax_rate) || 18;
      }
    }

    updated[index] = calculateLine(updated[index]);
    setLines(updated);
  };

  // Satir sil
  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  // Toplamlar
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const totalDiscount = lines.reduce((s, l) => s + l.discount_amount, 0);
  const totalTax = lines.reduce((s, l) => s + l.tax_amount, 0);
  const grandTotal = lines.reduce((s, l) => s + l.net_total, 0);

  // Kaydet
  const saveOrder = async () => {
    if (!order) return;
    const body = {
      header: { ...order },
      lines: lines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount_rate: l.discount_rate,
        tax_rate: l.tax_rate,
      })),
    };

    const res = await fetch('/v1/sales/orders', {
      method: 'POST', headers, body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      setIsNew(false);
      setSelectedOrderId(saved.id);
      // Listeyi yenile
      fetch('/v1/sales/orders', { headers }).then((r) => r.json()).then((d) => setOrders(d.data || []));
    }
  };

  // Durum degistir
  const changeStatus = async (action: string) => {
    if (!selectedOrderId) return;
    await fetch(`/v1/sales/orders/${selectedOrderId}/${action}`, { method: 'PUT', headers });
    // Yenile
    fetch(`/v1/sales/orders/${selectedOrderId}`, { headers }).then((r) => r.json()).then((d) => { setOrder(d); setLines(d.lines || []); });
    fetch('/v1/sales/orders', { headers }).then((r) => r.json()).then((d) => setOrders(d.data || []));
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sol: Siparis Listesi */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-800">Satis Siparisleri</h2>
          <button onClick={newOrder} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
            + Yeni
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {orders.length === 0 ? (
            <div className="p-4 text-xs text-gray-400 text-center">Siparis yok</div>
          ) : orders.map((o) => (
            <button
              key={o.id}
              onClick={() => { setIsNew(false); setSelectedOrderId(o.id); }}
              className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 ${selectedOrderId === o.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800">{o.order_no}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                  {STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{o.customer_name || 'Musteri'}</div>
              <div className="text-xs text-gray-400">{o.order_date} - {fmt(o.total)} TL</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sag: Siparis Detay */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-auto">
        {!order && !isNew ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-medium">Siparis secin veya yeni olusturun</p>
            </div>
          </div>
        ) : (
          <>
            {/* BASLIK */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">
                    {isNew ? 'Yeni Siparis' : order?.order_no}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {order?.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isNew && (
                    <button onClick={saveOrder} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                      Kaydet
                    </button>
                  )}
                  {order?.status === 'draft' && !isNew && (
                    <button onClick={() => changeStatus('confirm')} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                      Onayla
                    </button>
                  )}
                  {order?.status === 'confirmed' && (
                    <button onClick={() => changeStatus('ship')} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">
                      Sevk Et
                    </button>
                  )}
                  {(order?.status === 'draft' || order?.status === 'confirmed') && !isNew && (
                    <button onClick={() => changeStatus('cancel')} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">
                      Iptal
                    </button>
                  )}
                </div>
              </div>

              {/* Baslik Alanlari */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Musteri</label>
                  <select
                    value={order?.customer_id || ''}
                    onChange={(e) => setOrder({ ...order!, customer_id: e.target.value })}
                    disabled={!isNew && order?.status !== 'draft'}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Secin...</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Siparis Tarihi</label>
                  <input type="date" value={order?.order_date || ''} onChange={(e) => setOrder({ ...order!, order_date: e.target.value })}
                    disabled={!isNew && order?.status !== 'draft'}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Teslim Tarihi</label>
                  <input type="date" value={order?.delivery_date || ''} onChange={(e) => setOrder({ ...order!, delivery_date: e.target.value })}
                    disabled={!isNew && order?.status !== 'draft'}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Para Birimi</label>
                  <select value={order?.currency || 'TRY'} onChange={(e) => setOrder({ ...order!, currency: e.target.value })}
                    disabled={!isNew && order?.status !== 'draft'}
                    className="w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KALEM TABLOSU */}
            <div className="flex-1 p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Siparis Kalemleri</h3>
                {(isNew || order?.status === 'draft') && (
                  <button onClick={addLine} className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                    + Kalem Ekle
                  </button>
                )}
              </div>

              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-8">#</th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 min-w-[200px]">Urun</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-20">Miktar</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-24">Birim Fiyat</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-20">Isk. %</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-20">KDV %</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-28">Tutar</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-24">KDV</th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-28">Toplam</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">
                          Kalem eklemek icin "+ Kalem Ekle" butonunu kullanin
                        </td>
                      </tr>
                    ) : lines.map((line, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-1 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-2 py-1">
                          <select value={line.product_id} onChange={(e) => updateLine(i, 'product_id', e.target.value)}
                            disabled={!isNew && order?.status !== 'draft'}
                            className="w-full px-1 py-1 text-xs border rounded">
                            <option value="">Urun sec...</option>
                            {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
                            disabled={!isNew && order?.status !== 'draft'} min={0} step={0.001}
                            className="w-full px-1 py-1 text-xs border rounded text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={line.unit_price} onChange={(e) => updateLine(i, 'unit_price', Number(e.target.value))}
                            disabled={!isNew && order?.status !== 'draft'} min={0} step={0.01}
                            className="w-full px-1 py-1 text-xs border rounded text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={line.discount_rate} onChange={(e) => updateLine(i, 'discount_rate', Number(e.target.value))}
                            disabled={!isNew && order?.status !== 'draft'} min={0} max={100} step={0.01}
                            className="w-full px-1 py-1 text-xs border rounded text-right" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={line.tax_rate} onChange={(e) => updateLine(i, 'tax_rate', Number(e.target.value))}
                            disabled={!isNew && order?.status !== 'draft'} min={0} step={1}
                            className="w-full px-1 py-1 text-xs border rounded text-right" />
                        </td>
                        <td className="px-2 py-1 text-right text-xs font-mono">{fmt(line.line_total)}</td>
                        <td className="px-2 py-1 text-right text-xs font-mono">{fmt(line.tax_amount)}</td>
                        <td className="px-2 py-1 text-right text-xs font-mono font-semibold">{fmt(line.net_total)}</td>
                        <td className="px-2 py-1">
                          {(isNew || order?.status === 'draft') && (
                            <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TOPLAMLAR */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Notlar</label>
                  <textarea value={order?.notes || ''} onChange={(e) => setOrder({ ...order!, notes: e.target.value })}
                    disabled={!isNew && order?.status !== 'draft'}
                    className="w-full px-2 py-1.5 text-sm border rounded h-16 resize-none" placeholder="Siparis notu..." />
                </div>
                <div className="w-72 ml-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr><td className="py-1 text-gray-500">Ara Toplam:</td><td className="py-1 text-right font-mono">{fmt(subtotal)} TL</td></tr>
                      {totalDiscount > 0 && <tr><td className="py-1 text-red-500">Iskonto:</td><td className="py-1 text-right font-mono text-red-500">-{fmt(totalDiscount)} TL</td></tr>}
                      <tr><td className="py-1 text-gray-500">KDV:</td><td className="py-1 text-right font-mono">{fmt(totalTax)} TL</td></tr>
                      <tr className="border-t border-gray-300">
                        <td className="py-2 font-bold text-gray-800">Genel Toplam:</td>
                        <td className="py-2 text-right font-mono font-bold text-lg text-blue-700">{fmt(grandTotal)} TL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function fmt(n: any): string {
  return Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
