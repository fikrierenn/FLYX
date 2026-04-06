/**
 * FLYX Studio - Aksiyon Butonlari
 * ==================================
 * Durum gecisi butonlari: Onayla, Sevk Et, Iptal vs.
 * Sadece uygun durumda gorunur (visibleWhen kontrolu).
 */

import React from 'react';
import type { ActionSchema } from './FormEngine';

interface ActionRendererProps {
  actions: ActionSchema[];
  currentStatus?: string;
  onAction?: (action: string) => Promise<void>;
  disabled?: boolean;
}

const STYLE_MAP: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200',
  default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
};

export function ActionRenderer({ actions, currentStatus, onAction, disabled }: ActionRendererProps) {
  const visibleActions = actions.filter((a) => {
    if (!a.visibleWhen || a.visibleWhen.length === 0) return true;
    return currentStatus && a.visibleWhen.includes(currentStatus);
  });

  if (visibleActions.length === 0) return null;

  return (
    <div className="flex gap-2">
      {visibleActions.map((action) => (
        <button
          key={action.name}
          onClick={() => onAction?.(action.name)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 transition-colors ${
            STYLE_MAP[action.style] || STYLE_MAP.default
          }`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
