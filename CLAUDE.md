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
- **DB:** PostgreSQL (Kysely)
- **Test:** Vitest
- **Code Gen:** ts-morph (AST-based)

## Monorepo Yapisi

```
packages/
  fsl-compiler/      # FSL → AST (Chevrotain lexer/parser)
  database-engine/   # AST → SQL (schema, migration, query, CRUD)
  code-generator/    # AST → TypeScript/React (string + ts-morph)
  runtime-engine/    # Calisma zamani motoru
  platform-core/     # Platform cekirdek servisleri
  cli/               # flyx init/dev/generate/build/migrate
  desktop/           # Electron masaustu app (1C benzeri)
  ui/                # React component kutuphanesi (Radix + Tailwind)
  vscode/            # VSCode FSL extension
  create-flyx-app/   # npx create-flyx-app proje olusturucu
apps/
  api/               # NestJS REST API
  web/               # React frontend (Dashboard, FSL Editor, Form Designer)
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

### Code Generator Core Modulleri
- `core/naming/` - Pluralization, case conversion (V1 generator'lar bunu kullaniyor)
- `core/type-mapper/` - FSL → TS, HTML input, validator mapping
- `core/validation/` - DTO decorator uretimi
- `core/emitter/` - CodeEmitter (programatik kod uretimi)
- `core/generator-engine.ts` - Strategy + Plugin pattern

## Build & Test

```bash
npm run build          # Tum paketleri derle
npm run test           # Tum testleri calistir (92 test)
npx turbo run build --filter=@flyx/fsl-compiler  # Tek paket
```

## Dosya Duzenleme Kurallari

- Turkce yorum yaz (UTF-8 Turkce karakterler kullan)
- Her dosyanin basinda Turkce aciklama blogu olsun
- Yeni component eklerken Tailwind CSS kullan
- React component'ler functional component + hooks olsun
- NestJS'de decorator-based pattern kullan
