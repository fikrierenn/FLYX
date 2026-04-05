# FLYX Platform - Claude Code Proje Rehberi

## Proje Hakkinda

FLYX, FSL (FLYX Script Language) adli DSL ile is uygulamalari tanimlayan ve bunlardan otomatik SQL, API ve UI ureten bir enterprise platformdur.

**Vizyon:** SAP'in gucu + 1C'nin kolayligi + modern stack + AI-native + npm ekosistemi

## Teknoloji Stack

- **Monorepo:** Turborepo + npm workspaces
- **Dil:** TypeScript 5.4
- **Compiler:** Chevrotain (lexer + parser)
- **Backend:** NestJS 10 (multi-tenant, JWT, RBAC)
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + Radix UI
- **State:** Zustand
- **DnD:** @dnd-kit
- **Desktop:** Electron (1C benzeri)
- **DB:** PostgreSQL (pg driver, connection pool)
- **Test:** Vitest
- **Code Gen:** ts-morph (AST-based)
- **Runtime:** FSL Runtime Engine (ABAP benzeri trigger/method calistirma)

## Monorepo Yapisi

```
packages/
  fsl-compiler/      # FSL → AST (Chevrotain lexer/parser)
  database-engine/   # AST → SQL (schema, migration, query, CRUD)
  code-generator/    # AST → TypeScript/React (string + ts-morph)
  runtime-engine/    # FSL methods/triggers calistirma (ABAP runtime)
  platform-core/     # Platform cekirdek servisleri
  cli/               # flyx init/dev/generate/build/migrate
  desktop/           # Electron masaustu app (1C benzeri)
  ui/                # React component kutuphanesi (Radix + Tailwind)
  vscode/            # VSCode FSL extension
  create-flyx-app/   # npx create-flyx-app proje olusturucu
  module-finance/    # FIN - Muhasebe & Finans (FSL)
  module-sales/      # SLS - Satis & Dagitim (FSL)
  module-inventory/  # INV - Stok Yonetimi (FSL)
  module-procurement/# PRC - Satinalma (FSL)
  module-hr/         # HR - Insan Kaynaklari (FSL)
  module-wms/        # WMS - Depo Yonetimi (FSL)
  module-crm/        # CRM - Musteri Iliskileri (FSL)
apps/
  api/               # NestJS REST API (runtime entity loader, auth, audit)
  web/               # React frontend (ERP ekranlari + platform tasarimcilari)
```

## Onemli Konvansiyonlar

### FSL Isimlendirme
- Entity: PascalCase (`Customer`, `SaleOrder`)
- Field: snake_case (`credit_limit`, `order_date`)
- Form: PascalCase + "Form" (`CustomerForm`)
- Dosya: kebab-case (`sale-order.fsl`)

### TypeScript Isimlendirme
- Controller: `CustomersController` (cogul)
- Service: `CustomersService` (cogul)
- DTO: `CreateCustomerDto`, `UpdateCustomerDto`
- Store: `useCustomerStore`
- Page: `CustomersPage`

### Multi-Tenant
- Her tabloda `tenant_id UUID NOT NULL` sutunu
- Tum sorgularda `WHERE tenant_id = ?` filtresi zorunlu
- Subdomain veya X-Tenant-ID header ile tenant cozumleme
- Varsayilan tenant UUID: `00000000-0000-0000-0000-000000000001`

### Code Generator Core Modulleri
- `core/naming/` - Pluralization, case conversion (V1 generator'lar bunu kullaniyor)
- `core/type-mapper/` - FSL → TS, HTML input, validator mapping
- `core/validation/` - DTO decorator uretimi
- `core/emitter/` - CodeEmitter (programatik kod uretimi)
- `core/generator-engine.ts` - Strategy + Plugin pattern

## Runtime Engine (FSL = ABAP)

- FSL methods ve triggers gercek zamanli calisir (runtime-engine paketi)
- RecordContext = ABAP work area (this.field_name erisimi)
- before_create/after_create trigger'lari CRUD'da otomatik calisir
- Computed alanlar trigger icinde hesaplanir
- Is mantigi ASLA TS'de yazilmaz, FSL'de tanimlanir

## ERP Ekranlari

- Platform ekranlarindan (Form Designer) TAMAMEN BAGIMSIZ
- Master-detail: baslik + kalem tablosu (siparis, fatura, irsaliye)
- Hesaplama: miktar × fiyat - iskonto + KDV (FSL trigger ile)
- Belge numaralama: SIP-2026-0001 pattern
- Durum gecisi: draft → confirmed → shipped (geri alinamaz)

## Yetki Sistemi

- Sadece admin varsayilan rol (hardcoded roller YOK)
- Ilk kayit olan kullanici otomatik admin olur
- Dinamik yetki matrisi: rol × entity × aksiyon (CRUD)
- FSL permissions = varsayilan, sonra UI'dan degistirilebilir

## Modul Isimlendirme

- SAP isimlerini birebir kopyalama, FLYX'e ozel ama dogal isimler
- MM ikiye bolundu: INV (stok) + PRC (satinalma) + WMS (depo)
- Detay: SESSION_LOG.md dosyasina bak

## Gotcha'lar (Bilinen Sorunlar)

- `bcryptjs` kullan, `bcrypt` degil (Windows native build hatasi)
- Chevrotain'da ayni CONSUME iki kez → CONSUME2 suffix ekle
- ts-morph cift tirnak uretir, testlerde `'from "@nestjs/common"'` yaz
- Vite proxy: /v1, /health, /fsl hepsi proxy'lenmeli (sadece /api degil)
- tenant_id her zaman UUID olmali ("default" string KULLANMA)
- Turkce apostrof (import'lar) esbuild'da kirilir → apostrof kullanma
- YAPILACAKLAR.md duzenlerken ESKi ICERIGI SILME, ustune ekle
- Dev modda auth bypass: `import.meta.env.DEV`

## Build & Test

```bash
npm run build          # Tum paketleri derle
npm run test           # Tum testleri calistir (103 test)
npx turbo run build --filter=@flyx/fsl-compiler  # Tek paket
npx vitest run -u      # Snapshot guncelle
```

## Test Kurallari

- Toplam 103 test (compiler:17, database:8, code-gen:78)
- Her yeni generator/modul icin test yaz
- Edge case: optional fields, enum, relation, boolean
- Snapshot testleri degisikliklerde guncellenebilir: `npx vitest run -u`

## Dosya Duzenleme Kurallari

- Turkce yorum yaz (UTF-8 Turkce karakterler kullan)
- Her dosyanin basinda Turkce aciklama blogu olsun
- Yeni component eklerken Tailwind CSS kullan
- React component'ler functional component + hooks olsun
- NestJS'de decorator-based pattern kullan
- Is mantigi FSL'de tanimla, TS'de degil

## Referans Dosyalar

- `SESSION_LOG.md` - Tum mimari kararlar, mantiklar, ogrenimler
- `YAPILACAKLAR.md` - Tam roadmap ve ilerleme durumu
- `docs/FSL_SPEC.md` - FSL dil spesifikasyonu
- `docs/COMPILER_DESIGN.md` - Compiler tasarim detaylari
- `.claude/skills/` - 6 skill dosyasi (react, nestjs, fsl, code-gen, desktop, ui-ux)
