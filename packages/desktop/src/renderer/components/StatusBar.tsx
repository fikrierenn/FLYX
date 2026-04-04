/**
 * Alt Durum Çubuğu
 * ==================
 * Bağlantı durumu, aktif proje bilgisi ve kısayollar.
 */

import React from 'react';

export function StatusBar() {
  return (
    <div className="h-6 bg-blue-600 text-white flex items-center px-3 text-xs">
      <span className="mr-4">● Bağlı</span>
      <span className="mr-4">Proje: FLYX ERP</span>
      <span className="mr-4">Tenant: demo</span>
      <div className="flex-1" />
      <span className="mr-4">F2: Transaction Code</span>
      <span>Ctrl+Shift+A: AI</span>
    </div>
  );
}
