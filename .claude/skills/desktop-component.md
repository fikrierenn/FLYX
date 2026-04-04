---
name: desktop-component
description: FLYX Desktop (Electron) uygulamasi icin 1C benzeri component olusturma rehberi
---

# FLYX Desktop Component Skill

## 1C Benzeri UI Kaliplari

### Sol Sidebar (Proje Agaci)
```tsx
<div className="w-56 bg-gray-800 text-gray-300">
  {/* Bolum basligi */}
  <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 text-xs">
    <span>▼</span> <span>📦</span> <span>Entities</span>
  </button>
  {/* Alt ogeler */}
  <button className="w-full text-left px-3 py-1 text-xs hover:bg-gray-700 ml-4">
    • Customer
  </button>
</div>
```

### Entity Designer Tablosu (1C Style)
```tsx
<table className="w-full text-xs border-collapse">
  <thead>
    <tr className="bg-gray-100">
      <th className="border border-gray-300 px-2 py-1.5 text-left">#</th>
      <th className="border border-gray-300 px-2 py-1.5 text-left">Alan Adi</th>
      <th className="border border-gray-300 px-2 py-1.5 text-left w-32">Veri Tipi</th>
      <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Zorunlu</th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-gray-50 cursor-pointer">
      <td className="border border-gray-300 px-2 py-1 text-gray-400">1</td>
      <td className="border border-gray-300 px-1 py-0.5">
        <input className="w-full px-1 py-0.5 bg-transparent focus:bg-white focus:outline-none" />
      </td>
    </tr>
  </tbody>
</table>
```

### Tab Cubugu
```tsx
<div className="h-8 bg-gray-200 flex items-end overflow-x-auto">
  <div className="flex items-center gap-1 px-3 py-1 text-xs bg-white border-t-2 border-t-blue-500">
    Customer <button className="ml-1 text-gray-400 hover:text-red-500">✕</button>
  </div>
</div>
```

### Toolbar
```tsx
<div className="h-10 bg-white border-b border-gray-300 flex items-center px-3 gap-2">
  <span className="font-bold text-blue-600">FLYX Platform</span>
  <button className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">▶ Calistir</button>
  <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded">🤖 AI</button>
</div>
```

### Transaction Code Dialog
- F2 ile acilir
- SAP benzeri kod girisi (VA01, XD01, MM01)
- `findTransactionCode()` ile route eslestirme
- Hizli erisim listesi

## Renk Paleti (Desktop)
```
sidebar-bg: gray-800
sidebar-text: gray-300
sidebar-hover: gray-700
toolbar-bg: white
statusbar-bg: blue-600
tab-active: white + border-t-blue-500
tab-inactive: gray-100
```

## Kurallar
1. text-xs veya text-sm kullan (compact UI)
2. border-collapse tablo stili (1C benzeri)
3. inline editing (input bg-transparent, focus:bg-white)
4. F2 kisayolu transaction code icin
5. Alt panelde FSL kod onizleme (bg-gray-900 text-green-400)
