/**
 * Tab Yöneticisi
 * ===============
 * Birden fazla entity/form/report'u eş zamanlı açık tutma.
 * 1C:Enterprise'daki multi-tab çalışma alanı benzeri.
 */

import React from 'react';
import type { Tab } from '../../App';
import { EntityDesigner } from '../EntityDesigner/EntityDesigner';

interface TabManagerProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

export function TabManager({ tabs, activeTabId, onSelectTab, onCloseTab }: TabManagerProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">
        <div className="text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-lg font-medium">FLYX Platform</p>
          <p className="text-sm mt-2">Sol panelden bir öğe seçin veya F2 ile Transaction Code girin</p>
          <div className="mt-6 text-xs space-y-1">
            <p>F2 → Transaction Code</p>
            <p>Ctrl+N → Yeni Entity</p>
            <p>Ctrl+Shift+A → AI Assistant</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab Çubuğu */}
      <div className="h-8 bg-gray-200 flex items-end overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-1 px-3 py-1 text-xs cursor-pointer border-r border-gray-300 max-w-[180px] ${
              tab.id === activeTabId
                ? 'bg-white text-gray-800 border-t-2 border-t-blue-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="truncate">{tab.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              className="ml-1 text-gray-400 hover:text-red-500 text-[10px]"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Aktif Tab İçeriği */}
      <div className="flex-1 overflow-auto bg-white">
        {activeTab && <TabContent tab={activeTab} />}
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: Tab }) {
  switch (tab.type) {
    case 'entity':
      return <EntityDesigner entityName={tab.entityName || tab.title} />;
    case 'form':
      return <Placeholder title={tab.title} icon="📝" description="Form Designer - yakında" />;
    case 'report':
      return <Placeholder title={tab.title} icon="📊" description="Report Designer - yakında" />;
    case 'workflow':
      return <Placeholder title={tab.title} icon="🔄" description="Workflow Designer - yakında" />;
    case 'database':
      return <Placeholder title="Database Explorer" icon="🗄" description="Tablo ve veri önizleme - yakında" />;
    case 'fsl-editor':
      return <Placeholder title="FSL Editor" icon="📝" description="FSL Kod Editörü - yakında" />;
    default:
      return <Placeholder title={tab.title} icon="📄" description="" />;
  }
}

function Placeholder({ title, icon, description }: { title: string; icon: string; description: string }) {
  return (
    <div className="flex-1 flex items-center justify-center h-full text-gray-400">
      <div className="text-center">
        <p className="text-4xl mb-2">{icon}</p>
        <p className="font-medium">{title}</p>
        <p className="text-xs mt-1">{description}</p>
      </div>
    </div>
  );
}
