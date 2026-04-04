/**
 * Sol Sidebar - 1C Benzeri Proje Ağacı
 * ======================================
 * Entity, Form, Report, Workflow listelerini
 * ağaç yapısında gösterir. Tıklama ile yeni tab açar.
 *
 * 1C:Enterprise'daki "Configuration" paneli benzeri.
 */

import React, { useState } from 'react';
import type { Tab } from '../../App';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenTab: (tab: Omit<Tab, 'id'>) => void;
}

interface TreeSection {
  title: string;
  icon: string;
  type: Tab['type'];
  items: string[];
}

const SECTIONS: TreeSection[] = [
  {
    title: 'Entities',
    icon: '📦',
    type: 'entity',
    items: ['Customer', 'Product', 'Order', 'Invoice', 'Category'],
  },
  {
    title: 'Forms',
    icon: '📝',
    type: 'form',
    items: ['CustomerForm', 'ProductForm', 'OrderForm'],
  },
  {
    title: 'Reports',
    icon: '📊',
    type: 'report',
    items: ['SalesReport', 'InventoryReport'],
  },
  {
    title: 'Workflows',
    icon: '🔄',
    type: 'workflow',
    items: ['InvoiceApproval', 'OrderProcess'],
  },
];

export function Sidebar({ collapsed, onToggle, onOpenTab }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Entities']),
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  if (collapsed) {
    return (
      <div className="w-10 bg-gray-800 flex flex-col items-center py-2">
        <button onClick={onToggle} className="text-gray-400 hover:text-white text-lg mb-4">
          ☰
        </button>
        {SECTIONS.map((s) => (
          <div key={s.title} className="mb-2 text-lg cursor-pointer" title={s.title}>
            {s.icon}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-56 bg-gray-800 text-gray-300 flex flex-col overflow-y-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <span className="font-semibold text-white text-xs uppercase tracking-wider">MY ERP</span>
        <button onClick={onToggle} className="text-gray-500 hover:text-white">
          ◀
        </button>
      </div>

      {/* Ağaç Bölümleri */}
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 text-xs"
          >
            <span>{expandedSections.has(section.title) ? '▼' : '▶'}</span>
            <span>{section.icon}</span>
            <span className="font-medium">{section.title}</span>
            <span className="ml-auto text-gray-500 text-[10px]">{section.items.length}</span>
          </button>

          {expandedSections.has(section.title) && (
            <div className="ml-4">
              {section.items.map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    onOpenTab({
                      title: item,
                      type: section.type,
                      entityName: item,
                    })
                  }
                  className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 hover:text-white flex items-center gap-1.5"
                >
                  <span className="text-gray-500">•</span>
                  {item}
                </button>
              ))}

              {/* Yeni Ekleme Butonu */}
              <button className="w-full text-left px-3 py-1 text-xs text-gray-500 hover:text-green-400 hover:bg-gray-700">
                + Yeni {section.title.slice(0, -1)}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Alt Bölümler */}
      <div className="mt-auto border-t border-gray-700 py-2">
        <button
          onClick={() => onOpenTab({ title: 'Database Explorer', type: 'database' })}
          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 text-xs"
        >
          <span>🗄</span>
          <span>Database Explorer</span>
        </button>
        <button
          onClick={() => onOpenTab({ title: 'FSL Editor', type: 'fsl-editor' })}
          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 text-xs"
        >
          <span>📝</span>
          <span>FSL Editor</span>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 text-xs text-purple-400">
          <span>🤖</span>
          <span>AI Assistant</span>
        </button>
      </div>
    </div>
  );
}
