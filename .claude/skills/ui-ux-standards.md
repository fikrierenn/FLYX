---
name: ui-ux-standards
description: FLYX Platform UI/UX tasarim standartlari, kullanici dostu arayuz kurallari
---

# FLYX UI/UX Standartlari

## Temel Prensipler

1. **Tutarlilik**: Tum sayfalar ayni duzen, bosluk, renk ve yazi tipi kullanir
2. **Erislebilirlik**: Butonlar yeterince buyuk (min 36px), kontrast yeterli, focus gorunur
3. **Geri bildirim**: Her islem sonucu kullaniciya bildirilir (toast, badge, renk degisimi)
4. **Azaltma**: Gereksiz UI elemani ekleme, sadece gerekli olani goster
5. **Mobil uyumluluk**: min-w tanimlama, responsive grid, overflow-x-auto

## Sayfa Duzeni

```
┌─────────────────────────────────────────────────┐
│ Navbar (h-14, sticky, bg-white, shadow-sm)      │
│  Logo | Nav Links (aktif: font-semibold+border) │
├─────────────────────────────────────────────────┤
│ Page Content (max-w-7xl mx-auto p-6)            │
│                                                 │
│  Page Header (flex justify-between mb-6)        │
│    h1 (text-2xl font-bold)  |  Action Buttons   │
│                                                 │
│  Main Content (rounded-lg shadow bg-white)      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Navbar Standardi

```tsx
<nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
    <h1 className="text-lg font-bold text-blue-600">FLYX Platform</h1>
    <div className="flex items-center gap-1">
      {/* NavLink: aktif sayfa vurgulu */}
      <a className="px-3 py-2 rounded-md text-sm font-medium
        text-gray-600 hover:text-gray-900 hover:bg-gray-100
        [&.active]:text-blue-600 [&.active]:bg-blue-50" />
    </div>
  </div>
</nav>
```

## 3-Panel Designer Duzeni

Tum designer sayfalari (Form, Workflow, Report) ayni duzeni kullanmali:

```
┌────────────┬──────────────────────┬────────────┐
│ Sol Panel  │ Orta (Canvas/Preview)│ Sag Panel  │
│ w-60 (240) │ flex-1               │ w-72 (288) │
│ bg-white   │ bg-gray-50           │ bg-white   │
│ border-r   │                      │ border-l   │
│ overflow-y  │                      │ overflow-y  │
│            │                      │            │
│ BASLIK     │                      │ BASLIK     │
│ text-xs    │                      │ text-xs    │
│ uppercase  │                      │ uppercase  │
│ text-gray  │                      │ text-gray  │
│ tracking   │                      │ tracking   │
│ -500       │                      │ -500       │
│ font-semi  │                      │ font-semi  │
│ mb-3       │                      │ mb-3       │
├────────────┴──────────────────────┴────────────┤
│ Alt Panel (FSL Kod) h-48 bg-gray-900           │
│ text-green-400 font-mono text-sm               │
│ "Uretilen FSL" + "Kopyala" butonu              │
└────────────────────────────────────────────────┘
```

## Panel Baslik Standardi

```tsx
<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
  Baslik
</h3>
```

## Form Elemanlari

### Label + Input

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">Etiket</label>
  <input className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md
    focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
    placeholder:text-gray-400" />
</div>
```

### Compact Label + Input (panel icinde)

```tsx
<div>
  <label className="block text-xs text-gray-500 mb-1">Etiket</label>
  <input className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md
    focus:ring-1 focus:ring-blue-500 outline-none" />
</div>
```

### Butonlar

```tsx
{/* Primary - ana aksiyon */}
<button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md
  hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Kaydet
</button>

{/* Secondary - ikincil aksiyon */}
<button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md
  hover:bg-gray-50 transition-colors">
  Iptal
</button>

{/* Danger - tehlikeli islem */}
<button className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md
  hover:bg-red-700 transition-colors">
  Sil
</button>

{/* Small - panel ici kucuk buton */}
<button className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700">
  + Ekle
</button>
```

## Tablo Standardi

```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-gray-50 border-b border-gray-200">
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Baslik
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3 text-sm text-gray-700">Deger</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Status Badge

```tsx
{/* Active */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
  Active
</span>

{/* Inactive */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
  Inactive
</span>

{/* Blocked/Error */}
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
  Blocked
</span>
```

## Bos Durum (Empty State)

```tsx
<div className="flex flex-col items-center justify-center py-12 text-gray-400">
  <div className="text-4xl mb-3">📦</div>
  <p className="text-sm font-medium">Kayit bulunamadi</p>
  <p className="text-xs mt-1">Yeni kayit eklemek icin butonu kullanin</p>
</div>
```

## FSL Kod Onizleme Paneli

```tsx
<div className="border-t bg-gray-900 rounded-b-lg">
  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
      Uretilen FSL Kodu
    </span>
    <button className="text-xs text-gray-400 hover:text-white transition-colors">
      Kopyala
    </button>
  </div>
  <pre className="p-4 text-sm font-mono text-green-400 overflow-auto max-h-48">
    {fslCode}
  </pre>
</div>
```

## Kontrol Listesi (Her Sayfa Icin)

- [ ] Navbar link aktif durumu vurgulu mu?
- [ ] Sayfa basligi h1 text-2xl font-bold mu?
- [ ] Panel basliklar text-xs uppercase tracking-wider mu?
- [ ] Butonlar hover + focus state'i var mi?
- [ ] Tablo basliklar uppercase + tracking-wider mu?
- [ ] Bos durum (empty state) gosteriliyor mu?
- [ ] Form elemanlari focus:ring var mi?
- [ ] Responsive (overflow-x-auto) tablo var mi?
- [ ] FSL panel bg-gray-900 + text-green-400 mu?
- [ ] Kopyala butonu var mi?
- [ ] Spacing tutarli mi? (gap-4, p-6, mb-6)

## Renk Kullanimi

| Amac | Renk | Tailwind |
|---|---|---|
| Ana aksiyon | Mavi | blue-600, hover:blue-700 |
| Basari/aktif | Yesil | green-100/700 |
| Uyari | Sari | yellow-100/700 |
| Tehlike/hata | Kirmizi | red-100/700, red-600 |
| Devre disi | Gri | gray-100/400 |
| Ana metin | Koyu gri | gray-800 |
| Ikincil metin | Orta gri | gray-500 |
| Placeholder | Acik gri | gray-400 |
| Kenarlik | Acik gri | gray-200, hover:gray-300 |
| Sayfa arka plan | Cok acik | gray-50 |
| Kart arka plan | Beyaz | white |
| Kod arka plan | Koyu | gray-900 |
| Kod rengi | Yesil | green-400 |
