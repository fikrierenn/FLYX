---
name: react-component
description: FLYX projesi icin React component olusturma standartlari ve kaliplari
---

# FLYX React Component Skill

## Component Yapisi

```tsx
/**
 * [Component Adi] - [Kisa Aciklama]
 * ===================================
 * [Detayli Turkce aciklama]
 */

import React, { useState, useCallback } from 'react';

interface [ComponentName]Props {
  // Props tanimi
}

export function [ComponentName]({ ...props }: [ComponentName]Props) {
  // State
  // Handlers
  // Render
}
```

## Kurallar

1. **Functional component** kullan (class component KULLANMA)
2. **TypeScript interface** ile props tanimla (type degil interface)
3. **Tailwind CSS** kullan (inline style veya CSS modules KULLANMA)
4. **Turkce yorum** yaz (dosya basi + onemli bolumler)
5. **Named export** kullan (default export KULLANMA)
6. **Zustand** store kullan (Context API yerine, global state icin)
7. **@tanstack/react-query** kullan (server state icin)

## Tailwind Renk Paleti

```
primary: blue-600 (butonlar, linkler, vurgu)
success: green-600 (basari, aktif durum)
danger: red-600 (hata, silme)
warning: yellow-600 (uyari)
text: gray-800 (ana metin), gray-500 (ikincil), gray-400 (placeholder)
border: gray-200 (kenarlik), gray-300 (hover)
bg: gray-50 (sayfa), white (kart/panel)
```

## Form Elemanlari

```tsx
// Input
<input className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm
  focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />

// Button Primary
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium" />

// Button Secondary
<button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm" />

// Select
<select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />

// Checkbox
<input type="checkbox" className="rounded border-gray-300" />
```

## Tablo Yapisi

```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-gray-50 border-b">
        <th className="px-4 py-3 text-left font-medium text-gray-600">Baslik</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b hover:bg-gray-50">
        <td className="px-4 py-3">Deger</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Modal/Dialog

```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
    <h2 className="text-xl font-bold mb-4">Baslik</h2>
    {/* Icerik */}
    <div className="flex gap-3 justify-end pt-4 border-t">
      <button>Iptal</button>
      <button>Kaydet</button>
    </div>
  </div>
</div>
```

## Zustand Store Kalıbı

```tsx
import { create } from 'zustand';

interface EntityStore {
  items: Entity[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  create: (data: Omit<Entity, 'id'>) => Promise<void>;
  update: (id: string, data: Partial<Entity>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEntityStore = create<EntityStore>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/entities');
      const data = await res.json();
      set({ items: data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },
  // ...
}));
```

## Sayfa Yapisi

```tsx
export function EntitiesPage() {
  return (
    <div className="p-6">
      {/* Baslik + Aksiyon */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Baslik</h1>
        <button>+ Yeni</button>
      </div>

      {/* Icerik */}
      <div className="bg-white rounded-lg shadow">
        {/* Tablo veya kart listesi */}
      </div>
    </div>
  );
}
```
