# FLYX Platform - YAPILACAKLAR (Full Roadmap)

Son Guncelleme: 2026-04-05

---

## DURUM OZETI

| Paket | Durum | Ilerleme | Test |
|---|---|---|---|
| Monorepo (Turborepo) | TAMAM | 100% | - |
| @flyx/fsl-compiler | TAMAM | 100% | 17 test |
| @flyx/database-engine | TAMAM | 100% | 8 test |
| @flyx/code-generator | TAMAM (v2 refactored) | 95% | 78 test (5 dosya, 8 snapshot) |
| @flyx/api (NestJS) | TAMAM | 100% | - |
| @flyx/web (React) | TAMAM | 100% | - |
| @flyx/cli | BUILD TAMAM | 70% | - |
| @flyx/desktop (Electron) | RENDERER TAMAM | 70% | - |
| @flyx/ui | BUILD TAMAM | 60% | - |
| @flyx/vscode | BUILD TAMAM | 50% | - |
| create-flyx-app | BUILD TAMAM | 70% | - |
| @flyx/mobile | YOK | 0% | - |
| @flyx/ai | YOK | 0% | - |
| SAP Modules | YOK | 0% | - |
| Integration Packages | YOK | 0% | - |
| Module Marketplace | YOK | 0% | - |
| Cloud Deploy | YOK | 0% | - |

---

## 1. NPX CREATE-FLYX-APP (Oncelik: YUKSEK)

**Amac:** `npx create-flyx-app my-erp` ile yeni proje olusturma (Next.js gibi kolay)

**Dosya:** `packages/create-flyx-app/`

### Yapilacaklar:
- [x] Proje iskelet olusturma (package.json, tsconfig, flyx.config.ts)
- [x] Template sistemi (erp-starter, crm-starter, retail-pos, manufacturing, custom)
- [x] Entity + Form FSL dosyalarini template'den olusturma
- [ ] Interactive prompt (inquirer ile template, feature secimi)
- [ ] `--desktop` secildiginde Electron dosyalarini ekleme
- [ ] `--ai` secildiginde AI service dosyalarini ekleme
- [ ] npm publish icin hazirlik (bin field, prepublish script)
- [ ] README.md template ekleme
- [ ] Test yazma (proje olusturma + template dogrulama)

---

## 2. @FLYX/CLI (Oncelik: YUKSEK)

**Amac:** Rails/Laravel benzeri CLI araclari - `flyx init/dev/generate/deploy`

**Dosya:** `packages/cli/`

### Yapilacaklar:
- [x] `flyx init [name]` - proje olustur
- [x] `flyx dev` - dev server baslat
- [x] `flyx generate entity <Name>` - entity + form + test olustur
- [x] `flyx generate form <Name>` - form FSL olustur
- [x] `flyx generate report <Name>` - report FSL olustur
- [x] `flyx generate workflow <Name>` - workflow FSL olustur
- [x] `flyx generate module <Name>` - tam modul olustur
- [x] `flyx build` - production build
- [x] `flyx migrate` - FSL'den SQL migration olustur (--dry-run destegi)
- [ ] `flyx test` - vitest calistir + FSL dosyalarini validate et
- [ ] `flyx deploy` - FLYX Cloud'a deploy (staging/production)
- [ ] `flyx deploy --self-hosted` - Docker compose olustur
- [ ] `flyx doctor` - proje saglik kontrolu
- [ ] `flyx update` - paketleri guncelle
- [ ] `flyx marketplace install <package>` - marketplace'den modul yukle
- [ ] Interactive mode iyilestirmesi (inquirer ile template secimi)
- [ ] Renkli terminal ciktisi (chalk + ora spinner)
- [ ] npm global install testi (`npm install -g @flyx/cli`)

---

## 3. @FLYX/DESKTOP - Electron 1C Benzeri App (Oncelik: YUKSEK)

**Amac:** 1C gibi masaustu uygulama - visual designer, offline calisma, local DB

**Dosya:** `packages/desktop/`

### Yapilacaklar:
- [x] Electron main process (config, menu template, transaction codes)
- [x] Preload script (tip tanimlari, channel listesi)
- [x] **Renderer (Ana UI)**
  - [x] Sol sidebar: Proje agaci (Entities, Forms, Reports, Workflows)
  - [x] Sag panel: Visual Entity Designer (tablo gorunumu - 1C benzeri)
    - [x] Field ekleme/silme
    - [x] Tip secimi dropdown
    - [x] Constraint checkbox'lari (required, unique, indexed)
  - [x] Alt panel: FSL kod onizleme
  - [x] Tab sistemi (birden fazla entity/form acik)
- [x] **Transaction Code sistemi (SAP benzeri)**
  - [x] F2 ile transaction code girisi
  - [x] 8 varsayilan transaction code (VA01, XD01, MM01, FI01, ME21N, MB01)
  - [x] Hizli erisim listesi
  - [ ] Ozel transaction code tanimlama (FSL ile)
- [x] **Toolbar & StatusBar**
  - [x] Kaydet / Tumunu Kaydet / Calistir / Deploy butonlari
  - [x] AI Assistant butonu
  - [x] Baglanti durumu gostergesi
- [ ] **Database Explorer**
  - [ ] Tablo listesi
  - [ ] Tablo yapisi gorunumu
  - [ ] SQL sorgu calistirma
- [ ] **Offline calisma**
  - [ ] SQLite local database
  - [ ] Offline-first sync
- [ ] **Build & Package**
  - [ ] electron-builder ile .exe/.dmg/.AppImage olusturma
  - [ ] Auto-update (electron-updater)

---

## 4. @FLYX/UI - Component Library (Oncelik: YUKSEK)

**Amac:** FLYX'e ozel, Radix UI + Tailwind tabanli component kutuphanesi

**Dosya:** `packages/ui/`

### Yapilacaklar:
- [x] Button (primary, secondary, destructive, outline, ghost + sm/md/lg)
- [x] Input (label, error, disabled)
- [x] Select (options, label, error)
- [x] Table (generic, columns, onRowClick, empty state)
- [x] Card (title, description)
- [x] Dialog (Radix - overlay, content, close)
- [x] Toast (success, error, default)
- [x] Tabs (Radix - list, trigger, content)
- [x] cn() utility (clsx + tailwind-merge)
- [ ] **Eksik Componentler:**
  - [ ] Checkbox + Switch/Toggle
  - [ ] RadioGroup, Textarea, DatePicker
  - [ ] FileUpload, Avatar, Badge/Tag
  - [ ] Breadcrumb, Sidebar, Navbar
  - [ ] DataTable (sorting, filtering, pagination)
  - [ ] TreeView, CommandPalette, Tooltip, Popover
  - [ ] Accordion, Progress/Spinner, Alert
  - [ ] Form (react-hook-form entegrasyonu)
- [ ] **Tema sistemi** (Light/Dark mode, CSS variables)
- [ ] **Storybook** (her component icin story)
- [ ] Test yazma (her component icin)

---

## 5. @FLYX/MOBILE - React Native App (Oncelik: ORTA)

**Dosya:** `packages/mobile/` (OLUSTURULACAK)

### Yapilacaklar:
- [ ] React Native + Expo setup
- [ ] Navigation (React Navigation)
- [ ] Form renderer (FSL FormDeclaration → native form)
- [ ] Offline-first (WatermelonDB veya SQLite)
- [ ] Barcode/QR scanner, GPS, Kamera
- [ ] Biometric auth
- [ ] iOS + Android build

---

## 6. @FLYX/VSCODE - VSCode Extension (Oncelik: ORTA)

**Amac:** VSCode'da FSL dili destegi

**Dosya:** `packages/vscode/`

### Yapilacaklar:
- [x] Syntax highlighting (TextMate grammar - keywords, types, constraints, triggers, operators)
- [x] Language configuration (brackets, comments, indentation)
- [x] Code snippets (entity, form, report, workflow, field, trigger - 6 snippet)
- [x] Error diagnostics (FSLCompiler ile kaydetme sirasinda canli hata gosterimi)
- [x] Command palette komutlari (FLYX: Compile FSL, Generate SQL, Preview Form)
- [x] SQL uretimi yan sekmede acilir
- [ ] FSL Language Server Protocol (LSP) implementasyonu
- [ ] Autocomplete (keyword, data type, constraint, entity referansi)
- [ ] Hover bilgileri (field tipine hover → PostgreSQL karsiligi)
- [ ] Go to definition (Relation(Customer) → customer.fsl)
- [ ] FSL file icon
- [ ] VS Code marketplace yayinlama

---

## 7. @FLYX/AI - AI Services (Oncelik: ORTA)

**Dosya:** `packages/ai/` (OLUSTURULACAK)

### Yapilacaklar:
- [ ] AI Service temel altyapi (OpenAI / Anthropic API)
- [ ] Dogal Dil → FSL Donusumu
- [ ] Entity Generator (sektore gore)
- [ ] Code Improvement (FSL analiz + iyilestirme onerisi)
- [ ] AI Assistant (sohbet arayuzu, context-aware)
- [ ] SQL Optimizer
- [ ] Report/Workflow Generator (dogal dilden)

---

## 8. IS MODULLERI (Oncelik: ORTA - Faz 5'te detay var)

NOT: SAP modul adlari yerine FLYX'e ozel isimlendirme kullanildi. Detaylar Faz 5 bolumunde.

| FLYX Modul | Kisaltma | SAP Karsiligi |
|---|---|---|
| @flyx/module-finance | FIN | FI |
| @flyx/module-controlling | CTL | CO |
| @flyx/module-sales | SLS | SD |
| @flyx/module-procurement | PRC | MM (satin alma) |
| @flyx/module-inventory | INV | MM (stok) |
| @flyx/module-wms | WMS | WM |
| @flyx/module-production | PRD | PP |
| @flyx/module-quality | QMS | QM |
| @flyx/module-hr | HR | HR |
| @flyx/module-crm | CRM | CRM |
| @flyx/module-service | SVC | CS |
| @flyx/module-treasury | TRS | TR |
| @flyx/module-fixedassets | FXA | FI-AA |
| @flyx/module-logistics | LOG | TM |
| @flyx/module-projects | PRJ | PS |
| @flyx/module-contracts | CNT | - |
| @flyx/module-fleet | FLT | - |
| @flyx/module-einvoice | EIN | - (Turkiye) |
| @flyx/module-eledger | ELG | - (Turkiye) |
| @flyx/module-realestate | REM | RE |
| @flyx/module-assets | AST | PM |
| @flyx/module-pos | POS | - |
| @flyx/module-subscription | SUB | - |
| @flyx/module-analytics | ANL | BI/BW |

---

## 9. INTEGRATION PACKAGES (Oncelik: DUSUK)

- [ ] @flyx/integration-sap (RFC/BAPI, IDoc)
- [ ] @flyx/integration-stripe (odeme, subscription)
- [ ] @flyx/integration-shopify (urun/siparis/stok sync)
- [ ] @flyx/integration-quickbooks (muhasebe/fatura sync)
- [ ] @flyx/integration-efatura (UBL-TR, e-Arsiv, GIB, e-Irsaliye)

---

## 10. TRANSACTION CODE SISTEMI (Oncelik: ORTA)

### Yapilacaklar:
- [x] Transaction code registry (kod → rota eslestirmesi)
- [x] F2 kisa yolu ile transaction code girisi (desktop)
- [x] 8 varsayilan transaction kodu (VA01, VA02, VA03, MM01, XD01, FI01, ME21N, MB01)
- [x] Hizli erisim listesi (dialog icinde)
- [ ] Ctrl+K command palette (web)
- [ ] Ozel transaction code tanimlama (FSL ile)
- [ ] Transaction code arama (fuzzy search)
- [ ] Son kullanilan transaction kodlari listesi

---

## 11. MODULE MARKETPLACE (Oncelik: DUSUK)

- [ ] Marketplace web arayuzu
- [ ] Modul yayinlama/yukleme
- [ ] Versiyonlama, review/rating, lisans yonetimi

---

## 12. CLOUD DEPLOY (Oncelik: DUSUK)

- [ ] Docker/docker-compose
- [ ] Kubernetes (Helm chart)
- [ ] CI/CD (GitHub Actions)
- [ ] FLYX Cloud (managed hosting)
- [ ] Self-hosted deploy

---

## 13. WORKFLOW VISUAL DESIGNER (TAMAM)

- [x] @xyflow/react entegrasyonu
- [x] 6 Node tipi (Start, End, Decision, Approval, Action, Wait)
- [x] Property panel (node tipine gore farkli ozellikler)
- [x] FSL kod uretimi (generateWorkflowFSL)
- [x] /workflows route + navigasyon
- [ ] Parallel node tipi
- [ ] Workflow test/simulasyon

---

## 14. REPORT VISUAL DESIGNER (TAMAM)

- [x] Column secici (checkbox toggle)
- [x] Siralabilir tablo onizleme (mock data)
- [x] Bar chart gorsellestime (SVG)
- [x] Grafik tipi secimi (bar, line, pie, none)
- [x] X/Y eksen konfigurasyonu
- [x] Sutun etiketi duzenleme
- [x] Parametre destegi (DateRange)
- [x] FSL kod uretimi + kopyala butonu
- [x] /reports route + navigasyon
- [ ] Export (PDF, Excel, CSV)
- [ ] Filter builder (kosul ekleme)

---

## 15. CODE GENERATOR REFACTORING (TAMAM)

### Adim 1: Core Architecture Refactoring
- [x] v1 calisiyor (6 generator, 17 test)
- [x] Paylasilan mantigi core/ dizinine cikarildi
- [x] Base `Generator<TInput, TOutput>` interface (core/types.ts)
- [x] Yeni klasor yapisi olusturuldu (core/{naming,type-mapper,validation,emitter})
- [x] V1 generator'lar `core/naming` import'a migrate edildi (5 dosya)

### Adim 2: Merkezi Type Mapper
- [x] `mapToTSType()` - FSL → TypeScript tipleri
- [x] `mapToValidatorDecorators()` - FSL → class-validator decorator'lari
- [x] `mapToInputType()` - FSL → HTML input tipleri
- [x] `collectValidatorImports()` - Tekrarsiz import toplama
- [x] V1 DTO generator → core/type-mapper'a migrate edildi (duplicate mapToTSType kaldirildi)
- [x] V1 store-generator → core/type-mapper'a migrate edildi (duplicate tsType kaldirildi)
- [x] V1 form-modal-generator → core/type-mapper'a migrate edildi (duplicate inputType/defaultValue kaldirildi)

### Adim 3: Naming Engine
- [x] Dogru pluralization (category→categories, company→companies, box→boxes)
- [x] toPlural(), toSingular(), toPascalCase, toCamelCase, toKebabCase, toSnakeCase
- [x] Entity naming: toControllerName, toServiceName, toStoreName, toApiPath
- [x] fieldLabel → toLabel olarak standardize edildi

### Adim 4: Template Engine (CodeEmitter)
- [x] CodeEmitter sinifi (indent/dedent/block/each)
- [x] interpolate() ve dedent() yardimcilari
- NOT: EJS yerine sifir-bagimllik CodeEmitter tercih edildi
- NOT: V1 generator'lar inline string template kullanmaya devam ediyor (AST generator'lar ts-morph kullaniyor, ileride V1 da CodeEmitter'a tasinabilir ama kotu degilcalisiyor)

### Adim 5: Validation Engine
- [x] required→@IsNotEmpty, Email→@IsEmail, min/max→@Min/@Max
- [x] pattern→@Matches, Enum→@IsIn, optional→@IsOptional
- [x] generateDTOField() ve generateValidatorImports()

### Adim 6: Generator Strategy System
- [x] GeneratorEngine sinifi (registerGenerator + generate)
- [x] backend/frontend/skip secenekleri ile kosullu uretim

### Adim 7: Plugin System
- [x] GeneratorPlugin interface (beforeGenerate, afterGenerate hooks)
- [x] Dosya ekleme/degistirme destegi

### Adim 8: AST-Based Generation (ts-morph)
- [x] ASTControllerGenerator (ts-morph ile NestJS controller)
- [x] ASTServiceGenerator (ts-morph ile NestJS service)
- [x] ASTDTOGenerator (ts-morph ile class-validator DTO)
- [x] Import yonetimi (otomatik, tekrarsiz)
- [x] 16 AST-specific test

### Adim 9: Full Test Coverage
- [x] 78 test toplam (5 test dosyasi)
- [x] core.test.ts: 34 test (naming, type-mapper, validator, engine, emitter)
- [x] code-generator.test.ts: 17 test (v1 generator'lar)
- [x] ast-generators.test.ts: 16 test (ts-morph generator'lar)
- [x] snapshot.test.ts: 8 snapshot (tum uretilen dosya tipleri)
- [x] integration.test.ts: 3 test (FSL → compile → generate → dogrulama)

### Adim 10: End-to-End Demo
- [x] Customer + Product + Order pipeline testleri
- [ ] Dokumantasyon guncelleme (docs/ altinda)

---

## ONCELIK SIRASI

### Faz 1 - Cekirdek (TAMAM)
1. ~~Monorepo setup~~
2. ~~FSL Compiler (17 test)~~
3. ~~Database Engine (8 test)~~
4. ~~NestJS API~~
5. ~~React Web App~~
6. ~~Form Designer (dnd-kit)~~

### Faz 2 - Ekosistem (TAMAM)
7. ~~@flyx/cli (9 komut)~~
8. ~~@flyx/ui (9 component)~~
9. ~~create-flyx-app (5 template)~~
10. ~~@flyx/code-generator v1 (6 generator)~~

### Faz 2.5 - Code Generator Refactoring (TAMAM)
11. ~~Core architecture (types, engine)~~
12. ~~Type mapper + Naming engine~~
13. ~~CodeEmitter + Validation engine~~
14. ~~Plugin system + Strategy pattern~~
15. ~~AST-based generation (ts-morph, 16 test)~~
16. ~~Full test coverage (78 test, 8 snapshot)~~
17. ~~V1 generator migration (core/naming + core/type-mapper)~~

### Faz 3 - Developer Experience (TAMAM)
17. ~~@flyx/desktop renderer (Entity Designer, Sidebar, Tabs, Transaction Codes)~~
18. ~~@flyx/vscode extension (syntax, snippets, diagnostics, commands)~~
19. ~~Workflow Visual Designer (React Flow, 6 node, FSL uretimi)~~
20. ~~Report Visual Designer (tablo, grafik, FSL uretimi)~~
21. ~~README.md~~

### Faz 4 - Kritik Altyapi (SIRADA)
21. K1: Gercek DB baglantisi (PostgreSQL driver, connection pool)
22. K2: Kullanici & yetki yonetimi (User, Role, Permission, bcrypt, JWT refresh)
23. K3: Multi-tenant izolasyon guvenligi (TenantGuard)
24. K4: Ortam konfigurasyonu (.env, @nestjs/config)
25. K5: Audit log sistemi
26. K6: Guvenlik (CORS, rate limit, helmet, error handling, health check)

### Faz 5 - Is Modulleri
27. Cekirdek moduller (FIN, SLS, PRC, INV, WMS, HR, CTL)
28. Turkiye ozel (EIN, ELG)
29. Diger moduller (PRD, QMS, CRM, SVC, TRS, FXA, LOG, PRJ, CNT, FLT, POS, SUB, ANL, REM, AST)

### Faz 6 - Platform
30. @flyx/ai services
31. @flyx/mobile (React Native)
32. Cloud deploy (Docker, K8s, CI/CD)
33. Module marketplace
34. Integration packages

---

## KRITIK ALTYAPI EKSIKLERI (Faz 4 Detay)

### K1. Gercek Veritabani Baglantisi (KRITIK)

**Durum:** SQL uretiliyor ama hic calistirilmiyor. Veri saklanmiyor.

- [ ] PostgreSQL driver (node-postgres veya Prisma) entegrasyonu
- [ ] DatabaseService sinifi (connection pool, query execution)
- [ ] Transaction destegi (BEGIN/COMMIT/ROLLBACK)
- [ ] Migration runner (SQL dosyalarini DB'ye uygula)
- [ ] Seed data mekanizmasi (ilk veriler)
- [ ] Connection health check
- [ ] docker-compose.yml (PostgreSQL + API birlikte)

### K2. Kullanici & Yetki Yonetimi (KRITIK)

**Durum:** Fake auth - herkes admin. Sifre hashleme yok. Kullanici DB'si yok.

- [ ] **User entity** (email, password_hash, first_name, last_name, status, tenant_id)
- [ ] **Role entity** (name, description, permissions[])
- [ ] **UserRole iliskisi** (user_id, role_id)
- [ ] **Permission entity** (module, action: create/read/update/delete, resource)
- [ ] Sifre hashleme (bcrypt veya argon2)
- [ ] Kullanici kayit endpoint'i (POST /auth/register)
- [ ] Gercek login (email + sifre dogrulama, DB'den)
- [ ] Sifre sifirlama akisi (email token)
- [ ] Token refresh mekanizmasi (access 15dk + refresh 30 gun)
- [ ] Token blacklist (logout sonrasi gecersiz kilma)
- [ ] Kullanici CRUD UI (web - login, register, profil, kullanici listesi)
- [ ] Rol atama UI (web)

### K3. Multi-Tenant Izolasyon Guvenligi (KRITIK)

**Durum:** Middleware tenant_id cikariyor ama guard kontrol etmiyor.

- [ ] TenantGuard: kullanicinin tenant_id'si ile request tenant_id eslesme kontrolu
- [ ] Cross-tenant erisim engelleme
- [ ] Tenant entity (id, slug, name, plan, status)
- [ ] Tenant bazli kullanici davet sistemi

### K4. Ortam Konfigurasyonu (KRITIK)

**Durum:** Hardcoded secret'lar, port'lar. .env yok.

- [ ] @nestjs/config entegrasyonu
- [ ] `.env.example` (DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGINS, NODE_ENV)
- [ ] Ortam degiskeni validasyonu
- [ ] Hardcoded degerleri kaldir

### K5. Audit Log Sistemi (KRITIK)

**Durum:** created_by/updated_by sutunlari var ama hic doldurulmuyor.

- [ ] AuditLog entity (user_id, action, resource, resource_id, old_value, new_value, timestamp, ip, tenant_id)
- [ ] AuditingInterceptor (her CRUD islemini otomatik logla)
- [ ] Audit log sorgulama endpoint'i + UI
- [ ] created_by/updated_by otomatik doldurma

### K6. Guvenlik Iyilestirmeleri (YUKSEK)

- [ ] CORS konfigurasyonu (sadece izinli origin'ler)
- [ ] Rate limiting (@nestjs/throttler)
- [ ] Helmet (HTTP guvenlik header'lari)
- [ ] Global exception filter (yapisal hata yaniti, correlation ID)
- [ ] API versioning (/v1/ prefix)
- [ ] Health check endpoint'i (/health, /health/ready)

---

## IS MODULLERI (Faz 5 Detay)

### Cekirdek Moduller (YUKSEK)

| Modul | Kisaltma | SAP Karsiligi | Entity'ler |
|---|---|---|---|
| @flyx/module-finance | FIN | FI | Account, JournalEntry, Ledger, Period, Currency, Tax, BankAccount |
| @flyx/module-controlling | CTL | CO | CostCenter, ProfitCenter, Budget, CostAllocation |
| @flyx/module-sales | SLS | SD | Customer, SalesOrder, SalesOrderItem, Delivery, PriceList, Discount |
| @flyx/module-procurement | PRC | MM (satin alma) | Supplier, PurchaseOrder, PurchaseOrderItem, SupplierQuote, GoodsReceipt |
| @flyx/module-inventory | INV | MM (stok) | Material, StockMovement, StockCount, Lot, SerialNumber, StockLevel |
| @flyx/module-wms | WMS | WM | Warehouse, Location, Rack, PickingOrder, PackingSlip, Shipment |
| @flyx/module-hr | HR | HR | Employee, Department, Position, Leave, Payroll, Attendance, Contract |

### Uretim & Kalite (ORTA)

| Modul | Kisaltma | SAP | Entity'ler |
|---|---|---|---|
| @flyx/module-production | PRD | PP | BOM, WorkOrder, ProductionStep, Machine, Routing, Capacity |
| @flyx/module-quality | QMS | QM | QualityPlan, Inspection, InspectionResult, NonConformance, CAPA |

### Musteri & Servis (ORTA)

| Modul | Kisaltma | SAP | Entity'ler |
|---|---|---|---|
| @flyx/module-crm | CRM | CRM | Contact, Company, Deal, Activity, Pipeline, Campaign, Lead |
| @flyx/module-service | SVC | CS | ServiceTicket, SLA, ServiceContract, FieldVisit, Technician |

### Finans Detay (ORTA)

| Modul | Kisaltma | SAP | Entity'ler |
|---|---|---|---|
| @flyx/module-treasury | TRS | TR | CashAccount, CashFlow, BankReconciliation, Payment |
| @flyx/module-fixedassets | FXA | FI-AA | FixedAsset, Depreciation, AssetTransfer, AssetDisposal |

### Lojistik & Operasyon (ORTA)

| Modul | Kisaltma | SAP | Entity'ler |
|---|---|---|---|
| @flyx/module-logistics | LOG | TM | Shipment, Route, Carrier, FreightCost, TrackingEvent |
| @flyx/module-fleet | FLT | - | Vehicle, Driver, FuelLog, MaintenanceSchedule, GPSTrack |

### Proje & Sozlesme (ORTA)

| Modul | Kisaltma | SAP | Entity'ler |
|---|---|---|---|
| @flyx/module-projects | PRJ | PS | Project, Task, Milestone, TimeEntry, ProjectBudget, Resource |
| @flyx/module-contracts | CNT | - | Contract, ContractItem, Amendment, Renewal, Obligation, Approval |

### Turkiye Ozel (YUKSEK - yerel pazar)

| Modul | Kisaltma | Aciklama | Entity'ler |
|---|---|---|---|
| @flyx/module-einvoice | EIN | e-Fatura/e-Arsiv/e-Irsaliye | EInvoice, EArchive, EDespatchAdvice, GIBSubmission |
| @flyx/module-eledger | ELG | e-Defter/e-Belge | ELedgerEntry, ELedgerPeriod, EDocument, GIBDeclaration |

### Gayrimenkul & Varlik (DUSUK)

| Modul | Kisaltma | SAP | Entity'ler |
|---|---|---|---|
| @flyx/module-realestate | REM | RE | Property, Lease, Tenant, RentPayment, MaintenanceRequest |
| @flyx/module-assets | AST | PM | Asset, MaintenanceOrder, WorkRequest, Spare, Checklist |

### Modern / Dijital (ORTA)

| Modul | Kisaltma | Aciklama | Entity'ler |
|---|---|---|---|
| @flyx/module-pos | POS | Satis Noktasi | Register, Transaction, CashSession, Receipt, Barcode |
| @flyx/module-subscription | SUB | Abonelik | Plan, Subscription, BillingCycle, Usage, Invoice |
| @flyx/module-analytics | ANL | Is Zekasi | Dashboard, Widget, Report, DataSource, Schedule |

**TOPLAM: 24 Modul**
