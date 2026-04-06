/**
 * FLYX Studio Configurator - 1C:Configurator Benzeri
 * =====================================================
 * SADECE GORUNUM - backend baglantisi yok.
 * Mutabik kaldiktan sonra calisir hale getirilecek.
 */

import React, { useState } from 'react';
import {
  Database, FileText, BarChart3, Settings, Layers,
  ChevronRight, ChevronDown, Plus, Search, Code,
  Box, Receipt, BookOpen, Calculator, Users, Workflow,
  ClipboardList, Globe, Shield,
} from 'lucide-react';

// 1C Configuration agaci - mock data
const TREE = [
  {
    id: 'subsystems', label: 'Moduller', icon: Layers, color: 'text-blue-500',
    children: [
      { id: 'mod-sales', label: 'Satis', type: 'subsystem' },
      { id: 'mod-inventory', label: 'Stok & Depo', type: 'subsystem' },
      { id: 'mod-procurement', label: 'Satinalma', type: 'subsystem' },
      { id: 'mod-finance', label: 'Finans', type: 'subsystem' },
      { id: 'mod-hr', label: 'Insan Kaynaklari', type: 'subsystem' },
      { id: 'mod-crm', label: 'CRM', type: 'subsystem' },
    ],
  },
  {
    id: 'catalogs', label: 'Tanimlar (Catalogs)', icon: Database, color: 'text-emerald-500',
    children: [
      { id: 'cat-customer', label: 'Customer', type: 'entity', fields: 12 },
      { id: 'cat-product', label: 'Product', type: 'entity', fields: 17 },
      { id: 'cat-supplier', label: 'Supplier', type: 'entity', fields: 11 },
      { id: 'cat-warehouse', label: 'Warehouse', type: 'entity', fields: 6 },
      { id: 'cat-employee', label: 'Employee', type: 'entity', fields: 13 },
      { id: 'cat-account', label: 'Account', type: 'entity', fields: 7 },
      { id: 'cat-department', label: 'Department', type: 'entity', fields: 5 },
      { id: 'cat-currency', label: 'Currency', type: 'entity', fields: 5 },
    ],
  },
  {
    id: 'documents', label: 'Belgeler (Documents)', icon: FileText, color: 'text-amber-500',
    children: [
      { id: 'doc-salesorder', label: 'SalesOrder', type: 'document', fields: 11 },
      { id: 'doc-purchaseorder', label: 'PurchaseOrder', type: 'document', fields: 10 },
      { id: 'doc-stockmovement', label: 'StockMovement', type: 'document', fields: 9 },
      { id: 'doc-journalentry', label: 'JournalEntry', type: 'document', fields: 8 },
      { id: 'doc-goodsreceipt', label: 'GoodsReceipt', type: 'document', fields: 6 },
    ],
  },
  {
    id: 'registers', label: 'Registerler', icon: Calculator, color: 'text-violet-500',
    children: [
      {
        id: 'reg-accum', label: 'Birikim Registerleri', icon: BarChart3,
        children: [
          { id: 'reg-stockbalance', label: 'StockBalance', type: 'register', dims: 'product, warehouse' },
          { id: 'reg-stocklevel', label: 'StockLevel', type: 'register', dims: 'product, warehouse' },
        ],
      },
      {
        id: 'reg-info', label: 'Bilgi Registerleri', icon: BookOpen,
        children: [
          { id: 'reg-exchangerate', label: 'ExchangeRates', type: 'info_register' },
          { id: 'reg-pricelist', label: 'PriceList', type: 'info_register' },
        ],
      },
    ],
  },
  {
    id: 'reports', label: 'Raporlar', icon: BarChart3, color: 'text-rose-500',
    children: [
      { id: 'rpt-sales', label: 'SalesReport', type: 'report' },
      { id: 'rpt-stock', label: 'StockReport', type: 'report' },
      { id: 'rpt-financial', label: 'FinancialReport', type: 'report' },
    ],
  },
  {
    id: 'forms', label: 'Formlar', icon: ClipboardList, color: 'text-cyan-500',
    children: [
      { id: 'frm-customer', label: 'CustomerForm', type: 'form' },
      { id: 'frm-salesorder', label: 'SalesOrderForm', type: 'form' },
      { id: 'frm-product', label: 'ProductForm', type: 'form' },
      { id: 'frm-stockmovement', label: 'StockMovementForm', type: 'form' },
    ],
  },
  {
    id: 'workflows', label: 'Is Akislari', icon: Workflow, color: 'text-orange-500',
    children: [
      { id: 'wf-approval', label: 'InvoiceApproval', type: 'workflow' },
      { id: 'wf-order', label: 'OrderProcess', type: 'workflow' },
    ],
  },
  {
    id: 'api', label: 'API Yonetimi', icon: Globe, color: 'text-indigo-500',
    children: [
      { id: 'api-endpoints', label: 'Endpoint Listesi', type: 'api' },
      { id: 'api-keys', label: 'API Anahtarlari', type: 'api' },
      { id: 'api-webhooks', label: 'Webhook Tanimlari', type: 'api' },
      { id: 'api-docs', label: 'API Dokumantasyonu', type: 'api' },
    ],
  },
  {
    id: 'jobs', label: 'Zamanlanmis Gorevler', icon: ClipboardList, color: 'text-teal-500',
    children: [
      { id: 'job-backup', label: 'DatabaseBackup', type: 'scheduled_job' },
      { id: 'job-exchange', label: 'ExchangeRateSync', type: 'scheduled_job' },
      { id: 'job-report', label: 'DailyReportMail', type: 'scheduled_job' },
      { id: 'job-cleanup', label: 'AuditLogCleanup', type: 'scheduled_job' },
    ],
  },
  {
    id: 'integrations', label: 'Dis Entegrasyon', icon: Globe, color: 'text-pink-500',
    children: [
      { id: 'int-efatura', label: 'e-Fatura (GIB)', type: 'integration' },
      { id: 'int-earsiv', label: 'e-Arsiv', type: 'integration' },
      { id: 'int-bank', label: 'Banka Entegrasyonu', type: 'integration' },
      { id: 'int-ecommerce', label: 'E-Ticaret', type: 'integration' },
    ],
  },
  {
    id: 'settings', label: 'Sistem Ayarlari', icon: Settings, color: 'text-gray-500',
    children: [
      { id: 'set-company', label: 'Firma Bilgileri', type: 'constant' },
      { id: 'set-numbering', label: 'Belge Numaralama', type: 'constant' },
      { id: 'set-defaults', label: 'Varsayilan Degerler', type: 'constant' },
      { id: 'set-mail', label: 'E-posta Ayarlari', type: 'constant' },
    ],
  },
  {
    id: 'security', label: 'Guvenlik', icon: Shield, color: 'text-red-500',
    children: [
      { id: 'sec-roles', label: 'Roller', type: 'roles' },
      { id: 'sec-permissions', label: 'Yetkiler', type: 'permissions' },
    ],
  },
];

// Mock ozellik paneli verileri
const MOCK_PROPERTIES: Record<string, any> = {
  'cat-customer': {
    title: 'Customer', type: 'Entity (Catalog)',
    props: [
      { label: 'Ad', value: 'Customer' },
      { label: 'Tablo Adi', value: 'customer' },
      { label: 'Alan Sayisi', value: '12' },
      { label: 'Modul', value: 'Satis' },
      { label: 'Durum', value: 'Aktif' },
    ],
    tabs: ['Genel', 'Alanlar', 'Formlar', 'Komutlar', 'Haklar'],
    fields: [
      { name: 'code', type: 'String(50)', req: true, uniq: true },
      { name: 'name', type: 'String(200)', req: true, uniq: false },
      { name: 'email', type: 'Email', req: false, uniq: true },
      { name: 'phone', type: 'Phone', req: false, uniq: false },
      { name: 'status', type: 'Enum', req: false, uniq: false },
      { name: 'credit_limit', type: 'Decimal(15,2)', req: false, uniq: false },
    ],
  },
  'doc-salesorder': {
    title: 'SalesOrder', type: 'Document',
    props: [
      { label: 'Ad', value: 'SalesOrder' },
      { label: 'Numaralama', value: 'SIP-{YYYY}-{SEQ:4}' },
      { label: 'Alan Sayisi', value: '11' },
      { label: 'Kalem Entity', value: 'SalesOrderItem' },
      { label: 'Durum Akisi', value: 'draft → confirmed → shipped' },
      { label: 'Modul', value: 'Satis' },
    ],
    tabs: ['Genel', 'Alanlar', 'Kalemler', 'Formlar', 'Komutlar', 'Haklar'],
    fields: [
      { name: 'order_no', type: 'String(20)', req: true, uniq: true },
      { name: 'customer', type: 'Relation(Customer)', req: true, uniq: false },
      { name: 'order_date', type: 'Date', req: true, uniq: false },
      { name: 'total', type: 'Decimal(15,2)', req: false, uniq: false },
      { name: 'status', type: 'Enum', req: false, uniq: false },
    ],
  },
  'reg-stockbalance': {
    title: 'StockBalance', type: 'Register (Accumulation)',
    props: [
      { label: 'Ad', value: 'StockBalance' },
      { label: 'Register Tipi', value: 'Birikim (Balances)' },
      { label: 'Boyutlar', value: 'product, warehouse' },
      { label: 'Kaynaklar', value: 'quantity' },
      { label: 'Alan Sayisi', value: '7' },
    ],
    tabs: ['Genel', 'Boyutlar', 'Kaynaklar', 'Alanlar', 'Formlar'],
    fields: [
      { name: 'product', type: 'Relation(Product)', req: true, uniq: false },
      { name: 'warehouse', type: 'Relation(Warehouse)', req: true, uniq: false },
      { name: 'quantity', type: 'Decimal(10,3)', req: false, uniq: false },
      { name: 'available_quantity', type: 'Decimal(10,3)', req: false, uniq: false },
    ],
  },
  'api-endpoints': {
    title: 'API Endpoint Listesi', type: 'API Yonetimi',
    props: [
      { label: 'Toplam Endpoint', value: '24' },
      { label: 'Aktif', value: '24' },
      { label: 'Versiyon', value: 'v1' },
      { label: 'Base URL', value: '/v1/data/:entity' },
      { label: 'Kimlik Dogrulama', value: 'JWT Bearer Token' },
      { label: 'Rate Limit', value: '100 istek / 60 sn' },
    ],
    tabs: ['Genel', 'Endpoint Listesi', 'Ayarlar'],
  },
  'api-keys': {
    title: 'API Anahtarlari', type: 'API Yonetimi',
    props: [
      { label: 'Aktif Anahtar', value: '0' },
      { label: 'Maksimum', value: '10' },
      { label: 'Son Olusturma', value: '-' },
    ],
    tabs: ['Genel', 'Anahtarlar'],
  },
  'job-backup': {
    title: 'DatabaseBackup', type: 'Zamanlanmis Gorev',
    props: [
      { label: 'Ad', value: 'DatabaseBackup' },
      { label: 'Aciklama', value: 'Gunluk veritabani yedekleme' },
      { label: 'Zamanlama', value: '0 2 * * * (Her gun 02:00)' },
      { label: 'Son Calisma', value: '-' },
      { label: 'Durum', value: 'Aktif' },
    ],
    tabs: ['Genel', 'Zamanlama', 'Gecmis'],
  },
  'int-efatura': {
    title: 'e-Fatura (GIB)', type: 'Dis Entegrasyon',
    props: [
      { label: 'Entegrator', value: 'Foriba / QNB e-Fatura' },
      { label: 'Baglanti', value: 'Yapilandirilmadi' },
      { label: 'Mod', value: 'Test' },
      { label: 'Desteklenen', value: 'e-Fatura, e-Arsiv, e-Irsaliye' },
    ],
    tabs: ['Genel', 'Baglanti', 'Sablonlar', 'Gecmis'],
  },
  'set-company': {
    title: 'Firma Bilgileri', type: 'Sistem Ayari',
    props: [
      { label: 'Firma Adi', value: 'FLYX Demo Sirketi' },
      { label: 'Vergi No', value: '1234567890' },
      { label: 'Vergi Dairesi', value: 'Kadikoy' },
      { label: 'Adres', value: 'Istanbul, Turkiye' },
      { label: 'Telefon', value: '+90 212 555 0000' },
      { label: 'E-posta', value: 'info@flyxdemo.com' },
      { label: 'Web', value: 'www.flyxdemo.com' },
    ],
    tabs: ['Genel'],
  },
};

export function ConfiguratorPage() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['catalogs', 'documents']));
  const [selectedNode, setSelectedNode] = useState<string | null>('cat-customer');
  const [activeTab, setActiveTab] = useState('Genel');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectedProps = selectedNode ? MOCK_PROPERTIES[selectedNode] : null;

  return (
    <div className="flex h-[calc(100vh-56px)] bg-gray-100">
      {/* SOL: Configuration Agaci */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Baslik */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Configuration</h2>
            <div className="flex gap-1">
              <button className="p-1 rounded hover:bg-gray-200 text-gray-500" title="Yeni Nesne">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nesne ara..."
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Agac */}
        <div className="flex-1 overflow-y-auto py-1">
          {TREE.map((group) => (
            <TreeGroup
              key={group.id}
              group={group}
              expanded={expandedNodes}
              selected={selectedNode}
              onToggle={toggleNode}
              onSelect={setSelectedNode}
            />
          ))}
        </div>
      </div>

      {/* SAG: Ozellik Paneli */}
      <div className="flex-1 flex flex-col">
        {selectedProps ? (
          <>
            {/* Baslik */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  {selectedProps.type.includes('Document') ? <FileText className="w-5 h-5 text-amber-600" /> :
                   selectedProps.type.includes('Register') ? <Calculator className="w-5 h-5 text-violet-600" /> :
                   <Database className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{selectedProps.title}</h1>
                  <p className="text-xs text-gray-500">{selectedProps.type}</p>
                </div>
              </div>
            </div>

            {/* Tab'lar */}
            <div className="bg-white border-b border-gray-200 px-6">
              <div className="flex gap-0">
                {selectedProps.tabs?.map((tab: string) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Icerik */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'Genel' && (
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Genel Ozellikler</h3>
                  <table className="w-full">
                    <tbody>
                      {selectedProps.props?.map((p: any) => (
                        <tr key={p.label} className="border-b border-gray-100">
                          <td className="py-2.5 pr-4 text-sm text-gray-500 w-40">{p.label}</td>
                          <td className="py-2.5">
                            <input value={p.value} readOnly
                              className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Alanlar' && selectedProps.fields && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-3xl">
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-700">Alanlar</h3>
                    <button className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">
                      <Plus className="w-3 h-3" /> Alan Ekle
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium w-8">#</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Alan Adi</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500 font-medium">Veri Tipi</th>
                        <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium w-16">Zorunlu</th>
                        <th className="px-4 py-2 text-center text-xs text-gray-500 font-medium w-16">Benzersiz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProps.fields.map((f: any, i: number) => (
                        <tr key={f.name} className="border-b border-gray-50 hover:bg-blue-50/30">
                          <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium text-gray-700">{f.name}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">{f.type}</span>
                          </td>
                          <td className="px-4 py-2 text-center">{f.req ? '✓' : ''}</td>
                          <td className="px-4 py-2 text-center">{f.uniq ? '✓' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Formlar' && (
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Bagli Formlar</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <ClipboardList className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm text-gray-700">{selectedProps.title}Form</span>
                      <span className="text-xs text-gray-400 ml-auto">Liste + Detay</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <ClipboardList className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm text-gray-700">{selectedProps.title}ListForm</span>
                      <span className="text-xs text-gray-400 ml-auto">Liste</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Komutlar' && (
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Komutlar</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <Code className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Yeni {selectedProps.title}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <Code className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{selectedProps.title} Listesi</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Haklar' && (
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Erisim Haklari</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left text-xs text-gray-500">Rol</th>
                        <th className="py-2 text-center text-xs text-gray-500">Okuma</th>
                        <th className="py-2 text-center text-xs text-gray-500">Yazma</th>
                        <th className="py-2 text-center text-xs text-gray-500">Silme</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">admin</td>
                        <td className="py-2 text-center"><input type="checkbox" checked readOnly /></td>
                        <td className="py-2 text-center"><input type="checkbox" checked readOnly /></td>
                        <td className="py-2 text-center"><input type="checkbox" checked readOnly /></td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">manager</td>
                        <td className="py-2 text-center"><input type="checkbox" checked readOnly /></td>
                        <td className="py-2 text-center"><input type="checkbox" checked readOnly /></td>
                        <td className="py-2 text-center"><input type="checkbox" readOnly /></td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-700">user</td>
                        <td className="py-2 text-center"><input type="checkbox" checked readOnly /></td>
                        <td className="py-2 text-center"><input type="checkbox" readOnly /></td>
                        <td className="py-2 text-center"><input type="checkbox" readOnly /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {(activeTab === 'Kalemler' || activeTab === 'Boyutlar' || activeTab === 'Kaynaklar') && (
                <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">{activeTab}</h3>
                  <p className="text-sm text-gray-400">Bu sekme ileride aktif edilecek.</p>
                </div>
              )}
            </div>

            {/* Alt: FSL Kod Onizleme */}
            <div className="h-40 bg-gray-900 border-t border-gray-700 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">FSL Kodu</span>
                </div>
                <button className="text-xs text-gray-500 hover:text-white">Duzenle</button>
              </div>
              <pre className="flex-1 p-3 text-xs font-mono text-green-400 overflow-auto">
{selectedProps.type.includes('Document') ? `document ${selectedProps.title} {
  numbering: "SIP-{YYYY}-{SEQ:4}"
  fields {
${selectedProps.fields?.map((f: any) => `    ${f.name}: ${f.type}${f.req ? ' { required }' : ''}`).join('\n')}
  }
}` : selectedProps.type.includes('Register') ? `register ${selectedProps.title} {
  dimensions: "${selectedProps.props?.find((p: any) => p.label === 'Boyutlar')?.value || ''}"
  resources: "${selectedProps.props?.find((p: any) => p.label === 'Kaynaklar')?.value || ''}"
  fields {
${selectedProps.fields?.map((f: any) => `    ${f.name}: ${f.type}`).join('\n')}
  }
}` : `entity ${selectedProps.title} {
  fields {
${selectedProps.fields?.map((f: any) => `    ${f.name}: ${f.type}${f.req ? ' { required' : ''}${f.uniq ? (f.req ? ', unique }' : ' { unique }') : (f.req ? ' }' : '')}`).join('\n')}
  }
}`}
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">FLYX Studio Configurator</p>
              <p className="text-sm mt-1">Sol panelden bir nesne secin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Agac gorunum component'leri
function TreeGroup({ group, expanded, selected, onToggle, onSelect }: any) {
  const isExpanded = expanded.has(group.id);
  const Icon = group.icon || Box;

  return (
    <div>
      <button
        onClick={() => onToggle(group.id)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-gray-100"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
        <Icon className={`w-3.5 h-3.5 ${group.color || 'text-gray-400'}`} />
        <span className="font-semibold text-gray-700">{group.label}</span>
        <span className="ml-auto text-[10px] text-gray-400">{group.children?.length}</span>
      </button>

      {isExpanded && group.children && (
        <div className="ml-3">
          {group.children.map((child: any) =>
            child.children ? (
              <TreeGroup key={child.id} group={child} expanded={expanded} selected={selected} onToggle={onToggle} onSelect={onSelect} />
            ) : (
              <button
                key={child.id}
                onClick={() => onSelect(child.id)}
                className={`w-full flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
                  selected === child.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-gray-400">•</span>
                {child.label}
                {child.fields && <span className="ml-auto text-[10px] text-gray-400">{child.fields} alan</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
