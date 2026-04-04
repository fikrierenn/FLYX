/**
 * FLYX Desktop - Ana Uygulama Bileşeni
 * ======================================
 * 1C:Enterprise benzeri masaüstü uygulama arayüzü.
 *
 * Düzen:
 * ┌────────────────────────────────────────────────────┐
 * │ Üst Çubuk (toolbar): Kaydet, Çalıştır, Deploy     │
 * ├──────────┬─────────────────────────────────────────┤
 * │ Sol      │ Ana İçerik Alanı                        │
 * │ Sidebar  │ ┌─────────────────────────────────────┐ │
 * │          │ │ Tab Çubuğu                          │ │
 * │ Entities │ ├─────────────────────────────────────┤ │
 * │ Forms    │ │ Aktif Sayfa                         │ │
 * │ Reports  │ │ (Entity Designer / Form Designer)   │ │
 * │ Workflows│ │                                     │ │
 * │          │ └─────────────────────────────────────┘ │
 * │ AI       │                                         │
 * ├──────────┴─────────────────────────────────────────┤
 * │ Alt Çubuk: Durum, Bağlantı, AI Assistant           │
 * └────────────────────────────────────────────────────┘
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabManager } from './components/TabManager/TabManager';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { TransactionDialog } from './components/TransactionDialog/TransactionDialog';

export interface Tab {
  id: string;
  title: string;
  type: 'entity' | 'form' | 'report' | 'workflow' | 'database' | 'fsl-editor';
  entityName?: string;
}

export function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  const openTab = (tab: Omit<Tab, 'id'>) => {
    // Aynı başlıkta tab varsa ona geç
    const existing = tabs.find((t) => t.title === tab.title);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const id = crypto.randomUUID();
    const newTab = { ...tab, id };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id) {
      setActiveTabId(tabs.length > 1 ? tabs[tabs.length - 2]?.id ?? null : null);
    }
  };

  // F2 tuşu ile transaction code diyaloğu aç (SAP benzeri)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setShowTransactionDialog(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-sm">
      {/* Üst Araç Çubuğu */}
      <Toolbar />

      {/* Ana İçerik */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sol Sidebar - 1C benzeri proje ağacı */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenTab={openTab}
        />

        {/* Sağ Alan - Tab'lı içerik */}
        <div className="flex-1 flex flex-col">
          <TabManager
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onCloseTab={closeTab}
          />
        </div>
      </div>

      {/* Alt Durum Çubuğu */}
      <StatusBar />

      {/* F2 Transaction Code Diyaloğu */}
      {showTransactionDialog && (
        <TransactionDialog
          onClose={() => setShowTransactionDialog(false)}
          onNavigate={(route) => {
            setShowTransactionDialog(false);
            openTab({ title: route, type: 'form' });
          }}
        />
      )}
    </div>
  );
}
