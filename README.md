# FLYX Platform

**Enterprise uygulama gelistirme platformu** - FSL (FLYX Script Language) ile is uygulamalarini tanimla, platform otomatik kod uretsin.

```bash
npx create-flyx-app my-erp
cd my-erp
npm run dev
```

---

## Ne Yapar?

FSL kodu yazarsin:

```fsl
entity Customer {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    email: Email { unique }
    status: Enum { values: ["active", "inactive"], default: "active" }
  }
  permissions {
    create: ["admin", "manager"]
    read: ["admin", "manager", "user"]
    delete: ["admin"]
  }
}
```

Platform otomatik uretir:
- **PostgreSQL** tablo semasi (CREATE TABLE + INDEX + FK)
- **NestJS** controller, service, DTO (class-validator ile)
- **React** liste sayfasi, form modal, Zustand store
- **Swagger** API dokumantasyonu

---

## Ozellikler

| Ozellik | Durum |
|---|---|
| FSL Compiler (lexer, parser, AST) | Tamam (17 test) |
| SQL Generator (schema, migration, CRUD) | Tamam (8 test) |
| Code Generator (NestJS + React + ts-morph AST) | Tamam (78 test) |
| NestJS API (multi-tenant, JWT, RBAC, Swagger) | Tamam |
| React Web App | Tamam |
| Form Designer (surukleme-birakma, dnd-kit) | Tamam |
| Workflow Designer (React Flow, 6 node tipi) | Tamam |
| Report Designer (tablo, grafik, FSL uretimi) | Tamam |
| FSL Editor (canli derleme geri bildirimi) | Tamam |
| CLI (init, generate, build, migrate) | Tamam |
| Desktop App (Electron, 1C benzeri) | Tamam |
| UI Component Library (Radix + Tailwind) | Tamam |
| VSCode Extension (syntax, snippets, diagnostics) | Tamam |
| create-flyx-app (5 template) | Tamam |

---

## Hizli Baslangic

### Gereksinimler

- Node.js >= 20
- npm >= 11

### Kurulum

```bash
git clone https://github.com/fikrierenn/FLYX.git
cd FLYX
npm install
npm run build
```

### Gelistirme

```bash
# Tum dev server'lar (web + api)
npm run dev

# Sadece web (http://localhost:5173)
cd apps/web && npx vite

# Testler
npm run test
```

### CLI

```bash
# Proje olustur
npx flyx init my-project --template erp-starter

# Entity uret
npx flyx generate entity Customer

# Modul uret
npx flyx generate module Sales

# Migration olustur
npx flyx migrate --dry-run
```

---

## Proje Yapisi

```
packages/
  fsl-compiler/        FSL → AST (Chevrotain lexer/parser)
  database-engine/     AST → SQL (PostgreSQL schema, query, CRUD)
  code-generator/      AST → TypeScript/React (string + ts-morph)
  cli/                 flyx init/generate/build/migrate
  desktop/             Electron masaustu app (1C benzeri)
  ui/                  React component kutuphanesi
  vscode/              VSCode FSL extension
  create-flyx-app/     npx proje olusturucu
  runtime-engine/      Calisma zamani motoru
  platform-core/       Platform cekirdek servisleri
apps/
  api/                 NestJS REST API
  web/                 React frontend
docs/                  Dokumantasyon
```

---

## FSL Dili

FSL (FLYX Script Language) is uygulamalarini tanimlamak icin tasarlanmis bir DSL'dir.

### Desteklenen Yapilar

| Yapi | Ornek |
|---|---|
| Entity | `entity Customer { fields { ... } }` |
| Form | `form CustomerForm { entity: Customer ... }` |
| Report | `report SalesReport { columns { ... } }` |
| Workflow | `workflow InvoiceApproval { trigger: on_create(Invoice) ... }` |

### Veri Tipleri

| FSL | PostgreSQL | TypeScript |
|---|---|---|
| String(n) | VARCHAR(n) | string |
| Number | INTEGER | number |
| Decimal(p,s) | DECIMAL(p,s) | number |
| Boolean | BOOLEAN | boolean |
| Date | DATE | string |
| Email | VARCHAR(255) | string |
| Enum | VARCHAR(100) | string |
| Relation(X) | UUID + FK | string |
| JSON | JSONB | Record |
| Money | DECIMAL(15,2) | number |

### Constraint'ler

```fsl
name: String(200) { required, unique, indexed }
age: Number { min: 0, max: 150 }
status: String { default: "active" }
```

---

## Web Sayfalar

| Sayfa | Yol | Aciklama |
|---|---|---|
| Dashboard | `/` | Istatistik kartlari |
| Entities | `/entities` | FSL kod editoru |
| Forms | `/forms` | Surukleme-birakma form tasarimcisi |
| Workflows | `/workflows` | React Flow gorsel is akisi |
| Reports | `/reports` | Tablo + grafik rapor tasarimcisi |

---

## Code Generator

FSL entity'den tam CRUD stack uretir:

```
FSL Entity
    |
    +---> NestJS Controller (CRUD + Swagger + RBAC)
    +---> NestJS Service (findAll, findOne, create, update, remove)
    +---> Create DTO (class-validator decoratorleri)
    +---> Update DTO (PartialType)
    +---> NestJS Module
    +---> React Liste Sayfasi (tablo, siralama, filtreleme)
    +---> React Form Modal (create + edit)
    +---> Zustand Store (CRUD + API entegrasyonu)
```

Iki mod:
- **String-based**: Hizli, basit generator'lar
- **AST-based**: ts-morph ile tip-guvenli kod uretimi

---

## Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Dil | TypeScript 5.4 |
| Compiler | Chevrotain |
| Backend | NestJS 10 |
| Frontend | React 18 + Vite 5 |
| Stil | Tailwind CSS 3 + Radix UI |
| State | Zustand |
| DnD | @dnd-kit |
| Flow | @xyflow/react |
| Desktop | Electron |
| DB | PostgreSQL |
| Code Gen | ts-morph |
| Test | Vitest (92+ test) |

---

## Test

```bash
# Tum testler
npm run test

# Tek paket
cd packages/fsl-compiler && npx vitest run    # 17 test
cd packages/database-engine && npx vitest run  # 8 test
cd packages/code-generator && npx vitest run   # 78 test
```

---

## Dokumantasyon

- [FSL Dil Spesifikasyonu](docs/FSL_SPEC.md)
- [FSL Ornekleri](docs/FSL_EXAMPLES.md)
- [Mimari](docs/ARCHITECTURE.md)
- [Compiler Tasarimi](docs/COMPILER_DESIGN.md)
- [Komutlar](docs/COMMANDS.md)

---

## Vizyon

```
SAP'in gucu + 1C'nin kolayligi + modern stack + AI + npm ekosistemi
```

**Hedef:** Developer FSL yazar → Platform otomatik kod uretir → Hic TypeScript yazilmaz.

---

## Lisans

MIT
