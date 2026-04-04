# FLYX Platform - Mimari Dokumantasyonu

---

## 1. Genel Bakis

FLYX Platform, FSL (FLYX Script Language) adli domain-specific language ile is uygulamalari gelistirmeyi saglayan bir platformdur. Monorepo yapisinda Turborepo ile yonetilir.

```
FSL Kodu  →  Compiler  →  AST  →  Database Engine  →  SQL
                                →  API              →  REST Endpoints
                                →  Web UI           →  React Components
```

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|---|---|
| Monorepo | Turborepo |
| Dil | TypeScript 5.4 |
| Compiler | Chevrotain (lexer + parser) |
| Veritabani | PostgreSQL (Kysely query builder) |
| Backend API | NestJS 10 |
| Frontend | React 18 + Vite 5 |
| UI Framework | Tailwind CSS 3 + Radix UI |
| State | Zustand |
| Data Fetching | TanStack React Query |
| Form Builder | dnd-kit |
| Test | Vitest |
| Paket Yonetimi | npm workspaces |

---

## 3. Monorepo Yapisi

```
D:\Dev\FLYX\
├── package.json              # Root - Turborepo + shared deps
├── turbo.json                # Build pipeline tanimlari
├── tsconfig.base.json        # Paylasilan TypeScript config
├── .prettierrc               # Kod formatlama
├── eslint.config.js          # Linting
│
├── packages/                 # Paylasilan kutuphaneler
│   ├── fsl-compiler/         # FSL dil derleyicisi
│   ├── database-engine/      # SQL uretici + query builder
│   ├── runtime-engine/       # Calisma zamani motoru
│   ├── platform-core/        # Platform cekirdek servisleri
│   ├── cli/                  # Komut satiri araclari
│   ├── desktop/              # Electron masaustu uygulamasi
│   ├── ui/                   # React component kutuphanesi
│   └── create-flyx-app/      # Proje olusturucu (npx)
│
├── apps/                     # Uygulamalar
│   ├── api/                  # NestJS backend API
│   └── web/                  # React frontend
│
└── docs/                     # Dokumantasyon
```

---

## 4. Paket Detaylari

### 4.1 @flyx/fsl-compiler

**Gorev:** FSL kaynak kodunu AST'ye (Abstract Syntax Tree) donusturur.

**Yapisi:**

```
packages/fsl-compiler/
├── src/
│   ├── lexer/
│   │   ├── tokens.ts        # 70+ token tanimlama (Chevrotain createToken)
│   │   ├── lexer.ts         # FSLLexer sinifi
│   │   └── index.ts
│   ├── parser/
│   │   ├── parser.ts        # FSLParser sinifi (58 grammar kurali)
│   │   ├── cst-visitor.ts   # CSTToASTVisitor (CST → AST donusumu)
│   │   └── index.ts
│   ├── ast/
│   │   ├── nodes.ts         # 35+ AST node interface'i
│   │   └── index.ts
│   ├── compiler.ts          # Ana FSLCompiler sinifi
│   ├── errors.ts            # Hata siniflari
│   └── index.ts             # Public API
└── tests/
    └── compiler.test.ts     # 17 test
```

**Bagimliliklari:**
- `chevrotain` ^11.0.0 - Lexer + Parser framework
- `zod` ^3.22.0 - Schema validation

**Derleme Pipeline:**

```
FSL Kaynak Kodu
      │
      ▼
[1. Lexer] ── tokenize() ──→ Token[]
      │                        Hata varsa → FSLLexicalError
      ▼
[2. Parser] ── program() ──→ CST (Concrete Syntax Tree)
      │                        Hata varsa → FSLSyntaxError
      ▼
[3. Visitor] ── visit() ──→ AST (Abstract Syntax Tree)
      │
      ▼
Declaration[] (EntityDeclaration, FormDeclaration, ...)
```

### 4.2 @flyx/database-engine

**Gorev:** FSL AST'den SQL semalari ve CRUD islemleri uretir.

**Yapisi:**

```
packages/database-engine/
├── src/
│   ├── schema-generator/
│   │   ├── type-mapper.ts      # FSL tip → PostgreSQL tip esleme
│   │   ├── table-generator.ts  # CREATE TABLE + INDEX + FK uretimi
│   │   └── index.ts
│   ├── migration/
│   │   ├── migration-manager.ts # Migration dosyasi uretimi
│   │   └── index.ts
│   ├── query-builder/
│   │   ├── query-builder.ts    # SELECT/INSERT/UPDATE/DELETE
│   │   └── index.ts
│   ├── crud-generator/
│   │   ├── crud-generator.ts   # REST endpoint tanimlari
│   │   └── index.ts
│   └── index.ts
└── tests/
    └── schema-generator.test.ts # 8 test
```

**Veri Akisi:**

```
EntityDeclaration (AST)
      │
      ├──→ TableGenerator.generateSchema()
      │         │
      │         ├──→ CREATE TABLE SQL
      │         ├──→ CREATE INDEX SQL
      │         └──→ ALTER TABLE (Foreign Keys) SQL
      │
      ├──→ QueryBuilder
      │         │
      │         ├──→ selectAll(options)
      │         ├──→ selectById(id)
      │         ├──→ insert(data)
      │         ├──→ update(id, data)
      │         └──→ deleteById(id)
      │
      └──→ CRUDGenerator.generate()
                │
                └──→ CRUDOperation[] (method, path, sql)
```

### 4.3 @flyx/api (NestJS)

**Gorev:** REST API sunucusu - multi-tenant, JWT auth, FSL derleme endpoint'leri.

**Yapisi:**

```
apps/api/src/
├── main.ts                          # Bootstrap + Swagger
├── app.module.ts                    # Root module
├── common/
│   ├── decorators.ts                # @Public(), @Roles()
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # JWT dogrulama
│   │   ├── tenant.guard.ts          # Tenant kontrol
│   │   └── roles.guard.ts           # RBAC rol kontrol
│   ├── middleware/
│   │   └── tenant.middleware.ts     # Subdomain → tenant_id
│   └── interceptors/
│       └── logging.interceptor.ts   # HTTP loglama
└── modules/
    ├── tenant/                      # Tenant CRUD
    ├── auth/                        # JWT login
    ├── fsl/                         # FSL compile + SQL generate
    └── entities/                    # Dynamic entity CRUD
```

**API Endpoint'leri:**

| Method | Endpoint | Aciklama |
|---|---|---|
| POST | `/auth/login` | JWT token al |
| GET | `/tenants` | Tenant listele |
| POST | `/tenants` | Tenant olustur |
| POST | `/fsl/compile` | FSL → AST |
| POST | `/fsl/generate-sql` | FSL → SQL |
| GET | `/entities` | Kayitli entity'ler |
| POST | `/entities/register` | Entity kaydet |
| GET | `/entities/:name/operations` | CRUD operasyonlari |

**Multi-Tenant Akisi:**

```
HTTP Request
    │
    ▼
[TenantMiddleware]
    │  X-Tenant-ID header veya subdomain'den tenant_id coz
    ▼
[JwtAuthGuard]
    │  Bearer token dogrula
    ▼
[RolesGuard]
    │  Kullanicinin rollerini kontrol et
    ▼
[Controller] → [Service] → Yanit
```

### 4.4 @flyx/web (React)

**Gorev:** Web tabanli kullanici arayuzu.

**Yapisi:**

```
apps/web/src/
├── main.tsx                         # React entry point
├── App.tsx                          # Router + Layout
├── index.css                        # Tailwind imports
├── components/
│   ├── designers/
│   │   └── FormDesigner/
│   │       ├── FormDesigner.tsx     # Ana tasarimci (dnd-kit)
│   │       ├── FieldToolbox.tsx     # Sol panel - alan tipleri
│   │       ├── Canvas.tsx           # Orta - surukleme alani
│   │       └── PropertyPanel.tsx    # Sag - ozellik duzenleyici
│   ├── renderers/
│   │   ├── FormRenderer/           # FSL form → React form
│   │   └── ReportRenderer/         # FSL rapor → React tablo
│   └── editors/
│       └── FSLEditor/              # Kod editoru + canli derleme
├── pages/
│   ├── Dashboard/                   # Istatistik kartlari
│   ├── Entities/                    # FSL Editor sayfasi
│   └── Forms/                       # Form Designer sayfasi
├── hooks/
│   ├── useCompiler.ts              # FSLCompiler React hook
│   └── useTenant.ts                # Tenant context
└── stores/
    ├── authStore.ts                # Zustand auth state
    └── moduleStore.ts              # Zustand modul state
```

---

## 5. Build Pipeline (turbo.json)

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],   // Once bagimliliklari build et
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Build sirasi (dependency graph):**

```
fsl-compiler (bagimliligi yok)
    │
    ├──→ database-engine (fsl-compiler'a bagimli)
    │        │
    │        ├──→ runtime-engine
    │        │        │
    │        │        └──→ platform-core
    │        │                 │
    │        │                 ├──→ api
    │        │                 └──→ web
    │        │
    │        └──→ api
    │
    └──→ web (fsl-compiler'a dogrudan bagimli)
```

---

## 6. Multi-Tenant Mimarisi

Her tenant (firma/organizasyon) izole verilere sahiptir:

```
                    ┌─────────────────────┐
                    │   Load Balancer      │
                    └─────────┬───────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    abc.flyx.app         xyz.flyx.app         demo.flyx.app
         │                    │                    │
         ▼                    ▼                    ▼
    ┌─────────────────────────────────────────────────┐
    │              FLYX API (NestJS)                    │
    │  TenantMiddleware → tenant_id cozumleme          │
    └─────────────────────┬───────────────────────────┘
                          │
    ┌─────────────────────┼───────────────────────────┐
    │              PostgreSQL                          │
    │  Her tabloda tenant_id UUID NOT NULL             │
    │  WHERE tenant_id = ? filtresi otomatik           │
    └─────────────────────────────────────────────────┘
```

---

## 7. Test Yapisi

| Paket | Test Dosyasi | Test Sayisi |
|---|---|---|
| fsl-compiler | tests/compiler.test.ts | 17 |
| database-engine | tests/schema-generator.test.ts | 8 |
| **Toplam** | | **25** |

Tum testler Vitest ile calisir:

```bash
# Tek paket testi
cd packages/fsl-compiler && npx vitest run

# Tum testler
npx turbo run test
```
