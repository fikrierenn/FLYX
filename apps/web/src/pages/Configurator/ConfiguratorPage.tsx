/**
 * FLYX Studio Configurator
 * ==========================
 * Gercek API'den veri ceker - mock data YOK.
 * /v1/configuration/tree → agac
 * /v1/configuration/objects/:id → detay + FSL kodu
 */

import React, { useState, useEffect } from 'react';
import {
  Database, FileText, BarChart3, Settings, Layers,
  ChevronRight, ChevronDown, Plus, Search, Code,
  Calculator, Users, Workflow, ClipboardList, Globe, Shield,
  Save, Play, Bug, CheckCircle, Package, Trash2,
} from 'lucide-react';

const API_BASE = '/v1/configuration';

// Nesne tipi → Turkce etiket + ikon + renk
const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  entity: { label: 'Tanimlar (Catalogs)', icon: Database, color: 'text-emerald-500' },
  document: { label: 'Belgeler (Documents)', icon: FileText, color: 'text-amber-500' },
  register: { label: 'Registerler', icon: Calculator, color: 'text-violet-500' },
  form: { label: 'Formlar', icon: ClipboardList, color: 'text-cyan-500' },
  report: { label: 'Raporlar', icon: BarChart3, color: 'text-rose-500' },
  workflow: { label: 'Is Akislari', icon: Workflow, color: 'text-orange-500' },
};

// Statik menuler (API'den gelmeyen)
const STATIC_SECTIONS = [
  {
    id: 'api', label: 'API Yonetimi', icon: Globe, color: 'text-indigo-500',
    children: [
      { id: 'api-endpoints', label: 'Endpoint Listesi' },
      { id: 'api-keys', label: 'API Anahtarlari' },
      { id: 'api-webhooks', label: 'Webhook Tanimlari' },
    ],
  },
  {
    id: 'jobs', label: 'Zamanlanmis Gorevler', icon: ClipboardList, color: 'text-teal-500',
    children: [],
  },
  {
    id: 'integrations', label: 'Dis Entegrasyon', icon: Globe, color: 'text-pink-500',
    children: [
      { id: 'int-efatura', label: 'e-Fatura (GIB)' },
      { id: 'int-bank', label: 'Banka Entegrasyonu' },
    ],
  },
  {
    id: 'settings', label: 'Sistem Ayarlari', icon: Settings, color: 'text-gray-500',
    children: [
      { id: 'set-company', label: 'Firma Bilgileri' },
      { id: 'set-numbering', label: 'Belge Numaralama' },
    ],
  },
  {
    id: 'security', label: 'Guvenlik', icon: Shield, color: 'text-red-500',
    children: [
      { id: 'sec-roles', label: 'Roller' },
      { id: 'sec-permissions', label: 'Yetkiler' },
    ],
  },
];

interface ConfigObject {
  id: string;
  object_type: string;
  name: string;
  module: string;
  fsl_code: string;
  compiled_ast: any;
  metadata: any;
  version: number;
}

export function ConfiguratorPage() {
  const [tree, setTree] = useState<Record<string, ConfigObject[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['entity', 'document']));
  const [selectedObject, setSelectedObject] = useState<ConfigObject | null>(null);
  const [activeTab, setActiveTab] = useState('Genel');
  const [searchQuery, setSearchQuery] = useState('');
  const [fslCode, setFslCode] = useState('');
  const [saving, setSaving] = useState(false);

  // API'den agac yukle
  useEffect(() => {
    fetch(`${API_BASE}/tree`)
      .then((r) => r.json())
      .then((data) => { setTree(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Nesne sec
  const selectObject = (obj: ConfigObject) => {
    setSelectedObject(obj);
    setFslCode(obj.fsl_code);
    setActiveTab('Genel');
  };

  // FSL kaydet
  const saveFSL = async () => {
    if (!selectedObject) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/objects/${selectedObject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fsl_code: fslCode }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedObject(updated);
        // Agaci yenile
        const treeRes = await fetch(`${API_BASE}/tree`);
        setTree(await treeRes.json());
      }
    } finally {
      setSaving(false);
    }
  };

  // Nesne sil
  const deleteObject = async () => {
    if (!selectedObject || !confirm(`"${selectedObject.name}" nesnesini silmek istediginize emin misiniz?`)) return;
    await fetch(`${API_BASE}/objects/${selectedObject.id}`, { method: 'DELETE' });
    setSelectedObject(null);
    const treeRes = await fetch(`${API_BASE}/tree`);
    setTree(await treeRes.json());
  };

  // AST'den alan, metod, event bilgisi cikart
  const ast = selectedObject?.compiled_ast;
  const fields = ast?.fields || [];
  const methods = ast?.methods || [];
  const events = ast?.triggers?.triggers || [];
  const permissions = ast?.permissions;
  const metadata = selectedObject?.metadata || {};

  // Tab listesi (nesne tipine gore)
  const tabs = ['Genel', 'Alanlar'];
  if (methods.length > 0 || ['entity', 'document'].includes(selectedObject?.object_type || '')) tabs.push('Metodlar');
  tabs.push('Olaylar');
  if (selectedObject?.object_type === 'document') tabs.push('Kalemler');
  tabs.push('FSL Kodu', 'Haklar');

  // Arama filtresi
  const filterObjects = (objects: ConfigObject[]) => {
    if (!searchQuery) return objects;
    return objects.filter((o) => o.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const totalObjects = Object.values(tree).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* TOOLBAR */}
      <div className="h-9 bg-white border-b border-gray-200 flex items-center px-3 gap-1.5 flex-shrink-0">
        <button onClick={saveFSL} disabled={saving || !selectedObject}
          className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 font-medium flex items-center gap-1">
          <Save className="w-3 h-3" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        <button className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">↺ Geri Al</button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="px-2.5 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1">
          <Play className="w-3 h-3" /> Calistir
        </button>
        <button className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1">
          <Bug className="w-3 h-3" /> Debug
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Dogrula
        </button>
        <button className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1">
          <Package className="w-3 h-3" /> Yayinla
        </button>
        {selectedObject && (
          <>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button onClick={deleteObject}
              className="px-2.5 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Sil
            </button>
          </>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-gray-400">FLYX Studio v0.1.0 | {totalObjects} nesne</span>
      </div>

      <div className="flex flex-1 overflow-hidden bg-gray-100">
        {/* SOL: Configuration Agaci */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Configuration</h2>
              <button className="p-1 rounded hover:bg-gray-200 text-gray-500" title="Yeni Nesne">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nesne ara..." className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {loading ? (
              <div className="p-4 text-xs text-gray-400 text-center">Yukleniyor...</div>
            ) : (
              <>
                {/* DB'den gelen nesne tipleri */}
                {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                  const objects = filterObjects(tree[type] || []);
                  if (objects.length === 0 && searchQuery) return null;
                  const Icon = config.icon;
                  const isExpanded = expandedNodes.has(type);

                  return (
                    <div key={type}>
                      <button onClick={() => toggleNode(type)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-gray-100">
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span className="font-semibold text-gray-700">{config.label}</span>
                        <span className="ml-auto text-[10px] text-gray-400">{objects.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-5">
                          {objects.map((obj) => (
                            <button key={obj.id} onClick={() => selectObject(obj)}
                              className={`w-full flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
                                selectedObject?.id === obj.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                              }`}>
                              <span className="text-gray-400">•</span>
                              {obj.name}
                              <span className="ml-auto text-[10px] text-gray-400">{obj.metadata?.fieldCount || ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Statik menuler */}
                {STATIC_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isExpanded = expandedNodes.has(section.id);
                  return (
                    <div key={section.id}>
                      <button onClick={() => toggleNode(section.id)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-gray-100">
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                        <Icon className={`w-3.5 h-3.5 ${section.color}`} />
                        <span className="font-semibold text-gray-700">{section.label}</span>
                        <span className="ml-auto text-[10px] text-gray-400">{section.children.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-5">
                          {section.children.map((child) => (
                            <button key={child.id}
                              className="w-full flex items-center gap-1.5 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md">
                              <span className="text-gray-400">•</span>
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* SAG: Ozellik Paneli */}
        <div className="flex-1 flex flex-col">
          {selectedObject ? (
            <>
              {/* Baslik */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    {React.createElement(TYPE_CONFIG[selectedObject.object_type]?.icon || Database, {
                      className: `w-5 h-5 ${TYPE_CONFIG[selectedObject.object_type]?.color || 'text-gray-500'}`,
                    })}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">{selectedObject.name}</h1>
                    <p className="text-xs text-gray-500">
                      {TYPE_CONFIG[selectedObject.object_type]?.label || selectedObject.object_type}
                      {selectedObject.module && ` · ${selectedObject.module}`}
                      {` · v${selectedObject.version}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab'lar */}
              <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex gap-0">
                  {tabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icerik */}
              <div className="flex-1 overflow-auto p-6">
                {/* GENEL */}
                {activeTab === 'Genel' && (
                  <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Genel Ozellikler</h3>
                    <table className="w-full">
                      <tbody>
                        {[
                          ['Ad', selectedObject.name],
                          ['Tip', selectedObject.object_type],
                          ['Modul', selectedObject.module || '-'],
                          ['Versiyon', `v${selectedObject.version}`],
                          ['Alan Sayisi', metadata.fieldCount || 0],
                          ['Metodlar', metadata.hasMethods ? 'Var' : 'Yok'],
                          ['Trigger', metadata.hasTriggers ? 'Var' : 'Yok'],
                          ['Yetkiler', metadata.hasPermissions ? 'Tanimli' : 'Tanimsiz'],
                        ].map(([label, value]) => (
                          <tr key={label as string} className="border-b border-gray-100">
                            <td className="py-2.5 pr-4 text-sm text-gray-500 w-40">{label}</td>
                            <td className="py-2.5 text-sm text-gray-800 font-medium">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ALANLAR */}
                {activeTab === 'Alanlar' && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-3xl">
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-700">Alanlar ({fields.length})</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-4 py-2 text-left text-xs text-gray-500 w-8">#</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">Alan Adi</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">Veri Tipi</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-500 w-16">Zorunlu</th>
                          <th className="px-4 py-2 text-center text-xs text-gray-500 w-16">Benzersiz</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f: any, i: number) => (
                          <tr key={f.name} className="border-b border-gray-50 hover:bg-blue-50/30">
                            <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-4 py-2 font-medium text-gray-700">{f.name}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                {f.dataType?.name}{f.dataType?.params ? `(${f.dataType.params.join(',')})` : ''}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">{f.constraints?.required ? '✓' : ''}</td>
                            <td className="px-4 py-2 text-center">{f.constraints?.unique ? '✓' : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* METODLAR */}
                {activeTab === 'Metodlar' && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-3xl">
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700">Metodlar ({methods.length})</h3>
                    </div>
                    {methods.length === 0 ? (
                      <div className="p-6 text-sm text-gray-400 text-center">Metod tanimlanmamis</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {methods.map((m: any) => (
                          <div key={m.name} className="px-6 py-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Code className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm font-medium text-gray-700 font-mono">{m.name}()</span>
                            </div>
                            {m.body && m.body.length > 0 && (
                              <pre className="px-3 py-2 bg-gray-900 rounded-lg text-xs font-mono text-green-400 overflow-x-auto">
                                {`// ${m.body.length} statement`}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* OLAYLAR */}
                {activeTab === 'Olaylar' && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden max-w-3xl">
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700">Olaylar (Triggers)</h3>
                    </div>
                    {events.length === 0 ? (
                      <div className="p-6 text-sm text-gray-400 text-center">Trigger tanimlanmamis</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {events.map((ev: any) => (
                          <div key={ev.event} className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium text-gray-700">{ev.event}</span>
                              <span className="text-[10px] text-gray-400">{ev.body?.length || 0} statement</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* FSL KODU (duzenlenebilir) */}
                {activeTab === 'FSL Kodu' && (
                  <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden max-w-4xl">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">FSL Kaynak Kodu</span>
                      <button onClick={saveFSL} disabled={saving}
                        className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50">
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                    <textarea
                      value={fslCode}
                      onChange={(e) => setFslCode(e.target.value)}
                      className="w-full h-[400px] p-4 bg-gray-900 text-green-400 font-mono text-sm resize-none outline-none"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* HAKLAR */}
                {activeTab === 'Haklar' && (
                  <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Erisim Haklari</h3>
                    {permissions ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 text-left text-xs text-gray-500">Islem</th>
                            <th className="py-2 text-left text-xs text-gray-500">Roller</th>
                          </tr>
                        </thead>
                        <tbody>
                          {permissions.create && <tr className="border-b border-gray-50"><td className="py-2">Olusturma</td><td className="py-2">{permissions.create.join(', ')}</td></tr>}
                          {permissions.read && <tr className="border-b border-gray-50"><td className="py-2">Okuma</td><td className="py-2">{permissions.read.join(', ')}</td></tr>}
                          {permissions.update && <tr className="border-b border-gray-50"><td className="py-2">Guncelleme</td><td className="py-2">{permissions.update.join(', ')}</td></tr>}
                          {permissions.delete && <tr className="border-b border-gray-50"><td className="py-2">Silme</td><td className="py-2">{permissions.delete.join(', ')}</td></tr>}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-sm text-gray-400">Yetki tanimlanmamis</p>
                    )}
                  </div>
                )}

                {/* KALEMLER */}
                {activeTab === 'Kalemler' && (
                  <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Kalem Alanlari</h3>
                    <p className="text-xs text-gray-400">Document'in lines_entity bilgisi: {ast?.linesEntity || 'Tanimlanmamis'}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">FLYX Studio Configurator</p>
                <p className="text-sm mt-1">Sol panelden bir nesne secin</p>
                <p className="text-xs mt-3 text-gray-400">{totalObjects} nesne yuklendi (DB)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="h-6 bg-slate-800 text-slate-400 flex items-center px-3 text-[10px] flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Bagli
        </span>
        <span className="mx-3">|</span>
        <span>Nesneler: {totalObjects} (DB)</span>
        <span className="mx-3">|</span>
        <span>{selectedObject ? `Secili: ${selectedObject.object_type}/${selectedObject.name} v${selectedObject.version}` : 'Nesne secilmedi'}</span>
        <div className="flex-1" />
        <span>Tenant: demo | admin@flyx.com</span>
      </div>
    </div>
  );

  function toggleNode(id: string) {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
}
