/**
 * Üst Araç Çubuğu
 * =================
 * Kaydet, Çalıştır, Deploy butonları ve AI Assistant erişimi.
 */

import React from 'react';

export function Toolbar() {
  return (
    <div className="h-10 bg-white border-b border-gray-300 flex items-center px-3 gap-2">
      {/* Logo */}
      <span className="font-bold text-blue-600 mr-4">FLYX Platform</span>

      {/* Dosya İşlemleri */}
      <button className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="Ctrl+S">
        💾 Kaydet
      </button>
      <button className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="Ctrl+Shift+S">
        💾 Tümünü Kaydet
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Çalıştır/Deploy */}
      <button className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded">
        ▶ Çalıştır
      </button>
      <button className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded">
        🚀 Deploy
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Araçlar */}
      <button className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="F2">
        ⌨ Transaction Code (F2)
      </button>

      <div className="flex-1" />

      {/* AI Assistant */}
      <button className="px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded" title="Ctrl+Shift+A">
        🤖 AI Assistant
      </button>
    </div>
  );
}
