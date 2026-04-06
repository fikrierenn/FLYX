/** snake_case → Okunabilir Label: "movement_no" → "Hareket No" */
const LABEL_MAP: Record<string, string> = {
  // Genel
  code: 'Kod', name: 'Ad', description: 'Aciklama', notes: 'Notlar',
  status: 'Durum', is_active: 'Aktif', created_at: 'Olusturma',
  email: 'E-posta', phone: 'Telefon', address: 'Adres',
  city: 'Sehir', country: 'Ulke', currency: 'Para Birimi',

  // Musteri
  customer: 'Musteri', tax_id: 'Vergi No', credit_limit: 'Kredi Limiti',
  payment_term_days: 'Odeme Vadesi (Gun)', category: 'Kategori',

  // Siparis
  order_no: 'Siparis No', order_date: 'Siparis Tarihi', delivery_date: 'Teslim Tarihi',
  subtotal: 'Ara Toplam', discount_total: 'Iskonto', tax_amount: 'KDV',
  total: 'Genel Toplam', sales_order: 'Siparis',

  // Urun
  product: 'Urun', barcode: 'Barkod', unit: 'Birim', weight: 'Agirlik',
  unit_cost: 'Maliyet', sale_price: 'Satis Fiyati', tax_rate: 'KDV Orani',
  min_stock: 'Min Stok', max_stock: 'Max Stok', reorder_point: 'Yeniden Siparis',
  product_type: 'Urun Tipi',

  // Stok
  movement_no: 'Hareket No', movement_type: 'Hareket Tipi', quantity: 'Miktar',
  movement_date: 'Hareket Tarihi', reference_type: 'Referans Tipi',
  reference_no: 'Referans No', warehouse: 'Depo',
  reserved_quantity: 'Rezerve', available_quantity: 'Kullanilabilir',

  // Satinalma
  supplier: 'Tedarikci', purchase_order: 'Satinalma Siparisi',
  expected_date: 'Beklenen Tarih', receipt_no: 'Kabul No',
  receipt_date: 'Kabul Tarihi',

  // Finans
  account: 'Hesap', account_type: 'Hesap Tipi', parent_account: 'Ust Hesap',
  balance: 'Bakiye', entry_no: 'Fis No', entry_date: 'Fis Tarihi',
  total_debit: 'Toplam Borc', total_credit: 'Toplam Alacak',
  debit: 'Borc', credit: 'Alacak', cost_center: 'Maliyet Merkezi',
  journal_entry: 'Muhasebe Fisi', fiscal_period: 'Mali Donem',
  exchange_rate: 'Kur', is_base: 'Ana Doviz', rate: 'Oran',

  // HR
  employee: 'Calisan', employee_no: 'Sicil No', first_name: 'Ad',
  last_name: 'Soyad', department: 'Departman', position: 'Pozisyon',
  hire_date: 'Ise Giris', birth_date: 'Dogum Tarihi', salary: 'Maas',
  manager: 'Yonetici', leave_type: 'Izin Turu', start_date: 'Baslangic',
  end_date: 'Bitis', days: 'Gun', approved_by: 'Onaylayan',

  // Diger
  line_total: 'Satir Toplami', unit_price: 'Birim Fiyat',
  discount_rate: 'Iskonto %', discount_amount: 'Iskonto Tutari',
  net_total: 'Net Toplam', price_list: 'Fiyat Listesi',
  valid_from: 'Gecerlilik Bas.', valid_to: 'Gecerlilik Bit.',
  min_quantity: 'Min Miktar',
};

export function fieldLabel(name: string): string {
  if (LABEL_MAP[name]) return LABEL_MAP[name];
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Deger formatlama */
export function formatValue(value: any, type?: string): string {
  if (value == null || value === '') return '-';
  if (type === 'Boolean') return value ? 'Evet' : 'Hayir';
  if (type === 'Decimal' || type === 'Money') {
    return Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (type === 'Date') {
    try { return new Date(value).toLocaleDateString('tr-TR'); } catch { return String(value); }
  }
  if (type === 'DateTime') {
    try { return new Date(value).toLocaleString('tr-TR'); } catch { return String(value); }
  }
  return String(value);
}

/** Status renkleri */
export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    blocked: 'bg-red-100 text-red-700',
    draft: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    approved: 'bg-blue-100 text-blue-700',
    shipped: 'bg-violet-100 text-violet-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    received: 'bg-emerald-100 text-emerald-700',
    ordered: 'bg-violet-100 text-violet-700',
    planned: 'bg-amber-100 text-amber-700',
    in: 'bg-emerald-100 text-emerald-700',
    out: 'bg-red-100 text-red-700',
    transfer: 'bg-blue-100 text-blue-700',
    present: 'bg-emerald-100 text-emerald-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    true: 'bg-emerald-100 text-emerald-700',
    false: 'bg-gray-100 text-gray-600',
  };
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
}

/** Status label */
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Aktif', inactive: 'Pasif', blocked: 'Engelli',
    draft: 'Taslak', confirmed: 'Onaylandi', approved: 'Onaylandi',
    shipped: 'Sevk Edildi', delivered: 'Teslim Edildi', cancelled: 'Iptal',
    pending: 'Beklemede', completed: 'Tamamlandi', in_progress: 'Devam Ediyor',
    rejected: 'Reddedildi', received: 'Teslim Alindi', ordered: 'Siparis Verildi',
    in: 'Giris', out: 'Cikis', transfer: 'Transfer',
    true: 'Evet', false: 'Hayir',
    present: 'Var', absent: 'Yok', late: 'Gec',
    planned: 'Planlandi',
  };
  return labels[status?.toLowerCase()] || status;
}

/** Input tipi */
export function inputType(dt: string): string {
  const m: Record<string, string> = {
    Email: 'email', Phone: 'tel', URL: 'url',
    Number: 'number', Decimal: 'number', Money: 'number',
    Date: 'date', DateTime: 'datetime-local',
  };
  return m[dt] || 'text';
}
