# FLYX Platform - YAPILACAKLAR (Full Roadmap)

Son Guncelleme: 2026-04-05

---

## DURUM OZETI

| Paket | Durum | Ilerleme | Test |
|---|---|---|---|
| Monorepo (Turborepo) | TAMAM | 100% | - |
| @flyx/fsl-compiler | TAMAM | 100% | 17 test |
| @flyx/database-engine | TAMAM | 100% | 8 test |
| @flyx/api (NestJS) | TAMAM | 100% | - |
| @flyx/web (React) | TAMAM | 100% | - |
| @flyx/code-generator | TAMAM (v1) | 80% - refactoring gerekli | 17 test |
| @flyx/cli | BUILD TAMAM | 70% | - |
| @flyx/desktop (Electron) | BUILD TAMAM | 40% - renderer eksik | - |
| @flyx/ui | BUILD TAMAM | 60% | - |
| create-flyx-app | BUILD TAMAM | 70% | - |
| @flyx/mobile | YOK | 0% | - |
| @flyx/vscode | YOK | 0% | - |
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
  ```
  ? Project name: My ERP System
  ? Template: ERP Starter / CRM / Retail POS / Manufacturing / Custom
  ? Features: [x] Desktop App  [x] AI-Powered  [x] Multi-tenant
  ```
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
- [x] Electron main process (BrowserWindow, Menu, IPC)
- [x] Menu yapisi (File, Edit, Design, AI, Tools, Help)
- [x] Preload script (contextBridge ile flyx API)
- [x] IPC handlers (compile-fsl, generate-sql, transaction-codes)
- [ ] **Renderer (Ana UI)**
  - [ ] Sol sidebar: Proje agaci (Entities, Forms, Reports, Workflows)
  - [ ] Sag panel: Visual Entity Designer (tablo gorunumu - 1C benzeri)
    - [ ] Field ekleme/silme/siralama
    - [ ] Tip secimi dropdown
    - [ ] Constraint checkbox'lari (required, unique, indexed)
  - [ ] Alt panel: FSL kod onizleme (Monaco editor)
  - [ ] Tab sistemi (birden fazla entity/form acik)
- [ ] **Transaction Code sistemi (SAP benzeri)**
  - [ ] F2 ile transaction code girisi
  - [ ] VA01 → Create Sales Order formu acar
  - [ ] XD01 → Create Customer formu acar
  - [ ] Ozel transaction code tanimlama
- [ ] **Database Explorer**
  - [ ] Tablo listesi
  - [ ] Tablo yapisi gorunumu
  - [ ] SQL sorgu calistirma
  - [ ] Data onizleme
- [ ] **Offline calisma**
  - [ ] SQLite local database
  - [ ] Offline-first sync
  - [ ] Local file system FSL dosya yonetimi
- [ ] **Visual Workflow Designer**
  - [ ] Flowchart gorunumu (react-flow)
  - [ ] Drag-drop step ekleme
  - [ ] Condition/branch gorsel duzenleyici
- [ ] **Visual Report Designer**
  - [ ] Column secici
  - [ ] Filter/parameter duzenleyici
  - [ ] Chart onizleme
- [ ] **Build & Package**
  - [ ] electron-builder ile .exe/.dmg/.AppImage olusturma
  - [ ] Auto-update (electron-updater)
  - [ ] Code signing
- [ ] **Status bar**
  - [ ] [Save] [Run] [Deploy] butonlari
  - [ ] [Ask AI...] butonu
  - [ ] Connection status (online/offline)

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
  - [ ] RadioGroup
  - [ ] Textarea
  - [ ] DatePicker
  - [ ] TimePicker
  - [ ] FileUpload
  - [ ] Avatar
  - [ ] Badge / Tag
  - [ ] Breadcrumb
  - [ ] Sidebar (collapsible)
  - [ ] Navbar
  - [ ] DataTable (sorting, filtering, pagination)
  - [ ] TreeView (dosya agaci icin)
  - [ ] CommandPalette (Cmd+K menüsü)
  - [ ] Tooltip
  - [ ] Popover
  - [ ] Accordion
  - [ ] Progress / Spinner
  - [ ] Alert
  - [ ] Form (react-hook-form entegrasyonu)
- [ ] **Tema sistemi**
  - [ ] Light / Dark mode
  - [ ] CSS variables ile renk ozellestirme
  - [ ] Tenant bazli tema
- [ ] **Storybook**
  - [ ] Her component icin story
  - [ ] Docs mode
- [ ] Test yazma (her component icin)

---

## 5. @FLYX/MOBILE - React Native App (Oncelik: ORTA)

**Amac:** Mobil uygulama - saha ekipleri, pos, envanter

**Dosya:** `packages/mobile/` (OLUSTURULACAK)

### Yapilacaklar:
- [ ] React Native + Expo setup
- [ ] Navigation (React Navigation)
- [ ] Form renderer (FSL FormDeclaration → native form)
- [ ] Entity list/detail ekranlari
- [ ] Offline-first (WatermelonDB veya SQLite)
- [ ] Push notification
- [ ] Barcode/QR scanner
- [ ] GPS konum takibi (filo yonetimi icin)
- [ ] Kamera entegrasyonu (belge tarama)
- [ ] Biometric auth (parmak izi, face id)
- [ ] iOS + Android build

---

## 6. @FLYX/VSCODE - VSCode Extension (Oncelik: ORTA)

**Amac:** VSCode'da FSL dili destegi - syntax highlighting, autocomplete, lint

**Dosya:** `packages/vscode/` (OLUSTURULACAK)

### Yapilacaklar:
- [ ] FSL Language Server Protocol (LSP) implementasyonu
- [ ] Syntax highlighting (TextMate grammar .tmLanguage.json)
  - [ ] Keywords: module, entity, form, report, workflow
  - [ ] Data types: String, Number, Decimal, Boolean, Date...
  - [ ] Constraints: required, unique, indexed
  - [ ] Comments: // ve /* */
- [ ] Autocomplete
  - [ ] Keyword completion
  - [ ] Data type completion
  - [ ] Constraint completion
  - [ ] Entity referansi (Relation icin)
- [ ] Error diagnostics (FSLCompiler hatalari kirmizi altcizgi)
- [ ] Hover bilgileri (field tipine hover → PostgreSQL karsiligi)
- [ ] Go to definition (Relation(Customer) → customer.fsl)
- [ ] Code snippets (entity template, form template, vb.)
- [ ] FSL file icon
- [ ] Command palette komutlari
  - [ ] FLYX: Compile FSL
  - [ ] FLYX: Generate SQL
  - [ ] FLYX: Preview Form
- [ ] VS Code marketplace yayinlama

---

## 7. @FLYX/AI - AI Services (Oncelik: ORTA)

**Amac:** AI destekli gelistirme - entity uretme, kod iyilestirme, dogal dil → FSL

**Dosya:** `packages/ai/` (OLUSTURULACAK)

### Yapilacaklar:
- [ ] AI Service temel altyapi (OpenAI / Anthropic API entegrasyonu)
- [ ] **Dogal Dil → FSL Donusumu**
  - [ ] "Create a customer management system" → Customer entity + form + report FSL
  - [ ] "Add phone field to Customer" → FSL guncelleme onerisi
- [ ] **Entity Generator**
  - [ ] Sektore gore entity sablonlari uretme
  - [ ] Iliskili entity'leri otomatik olusturma
- [ ] **Code Improvement**
  - [ ] FSL kodu analiz et, iyilestirme oner
  - [ ] Missing index onerisi
  - [ ] Permission kontrolu onerisi
- [ ] **AI Assistant (Desktop + Web)**
  - [ ] Sohbet arayuzu
  - [ ] Context-aware (acik dosyayi bilir)
  - [ ] Kod aciklama
- [ ] **SQL Optimizer**
  - [ ] Uretilen SQL'i analiz et
  - [ ] Index onerisi
  - [ ] Query optimizasyon onerisi
- [ ] **Report Generator**
  - [ ] "Show me monthly sales by customer" → Report FSL
- [ ] **Workflow Generator**
  - [ ] "When order > 10000, require approval" → Workflow FSL

---

## 8. SAP MODULES (Oncelik: ORTA-DUSUK)

**Amac:** SAP modul yapisina benzer hazir is modulleri

### Yapilacak Moduller:

#### @flyx/module-fi (Finance - Muhasebe)
- [ ] Account entity (hesap plani)
- [ ] JournalEntry entity (muhasebe fisit)
- [ ] Ledger entity (defteri kebir)
- [ ] Period entity (donem yonetimi)
- [ ] Currency entity (doviz kurlari)
- [ ] Tax entity (vergi oranlari)
- [ ] Financial reports (bilanço, gelir tablosu)

#### @flyx/module-sd (Sales & Distribution)
- [ ] Customer entity
- [ ] SalesOrder entity
- [ ] SalesOrderItem entity
- [ ] Delivery entity
- [ ] Invoice entity
- [ ] PriceList entity
- [ ] Sales pipeline reports

#### @flyx/module-mm (Materials Management)
- [ ] Material / Product entity
- [ ] Warehouse entity
- [ ] StockMovement entity
- [ ] PurchaseOrder entity
- [ ] Supplier entity
- [ ] Inventory reports

#### @flyx/module-pp (Production Planning)
- [ ] BillOfMaterials entity
- [ ] WorkOrder entity
- [ ] ProductionStep entity
- [ ] QualityCheck entity
- [ ] Machine entity
- [ ] Production reports

#### @flyx/module-hr (Human Resources)
- [ ] Employee entity
- [ ] Department entity
- [ ] Position entity
- [ ] Leave entity
- [ ] Payroll entity
- [ ] Attendance entity
- [ ] HR reports

#### @flyx/module-crm (Customer Relations)
- [ ] Contact entity
- [ ] Company entity
- [ ] Deal / Opportunity entity
- [ ] Activity entity
- [ ] Campaign entity
- [ ] CRM pipeline reports

---

## 9. INTEGRATION PACKAGES (Oncelik: DUSUK)

### Yapilacaklar:

#### @flyx/integration-sap
- [ ] SAP RFC/BAPI baglantisi
- [ ] Data sync (Customer, Material, Order)
- [ ] IDoc entegrasyonu

#### @flyx/integration-stripe
- [ ] Odeme isleme
- [ ] Subscription yonetimi
- [ ] Webhook handler

#### @flyx/integration-shopify
- [ ] Urun sync
- [ ] Siparis sync
- [ ] Stok sync

#### @flyx/integration-quickbooks
- [ ] Muhasebe sync
- [ ] Fatura sync

#### @flyx/integration-efatura (Turkiye)
- [ ] e-Fatura olusturma (UBL-TR)
- [ ] e-Arsiv
- [ ] GIB entegrasyonu
- [ ] e-Irsaliye

---

## 10. TRANSACTION CODE SISTEMI (Oncelik: ORTA)

**Amac:** SAP benzeri transaction code ile hizli navigasyon

### Yapilacaklar:
- [ ] Transaction code registry (kod → rota eslestirmesi)
- [ ] F2 kisa yolu ile transaction code girisi (desktop)
- [ ] Ctrl+K command palette (web)
- [ ] Varsayilan transaction kodlari:
  ```
  VA01 - Create Sales Order
  VA02 - Change Sales Order
  VA03 - Display Sales Order
  MM01 - Create Material
  XD01 - Create Customer
  FI01 - Create Bank Master
  ME21N - Create Purchase Order
  MB01 - Goods Receipt
  ```
- [ ] Ozel transaction code tanimlama (FSL ile)
  ```fsl
  transaction "VA01" {
    name: "Create Sales Order"
    module: "SD"
    form: SalesOrderForm
  }
  ```
- [ ] Transaction code arama (fuzzy search)
- [ ] Son kullanilan transaction kodlari listesi

---

## 11. MODULE MARKETPLACE (Oncelik: DUSUK)

**Amac:** npm benzeri modul marketplace - topluluk modulleri

### Yapilacaklar:
- [ ] Marketplace web arayuzu
- [ ] Modul yayinlama (`flyx publish`)
- [ ] Modul yukleme (`flyx marketplace install @flyx/module-fi`)
- [ ] Modul versiyonlama (semver)
- [ ] Modul bagimliliklari
- [ ] Modul review/rating sistemi
- [ ] Modul kategorileri (Finance, Sales, HR, Industry-specific)
- [ ] API (NestJS endpoint'leri)
- [ ] Lisans yonetimi (free, premium, enterprise)

---

## 12. CLOUD DEPLOY (Oncelik: DUSUK)

**Amac:** `flyx deploy` ile tek komutla buluta deploy

### Yapilacaklar:
- [ ] Docker container olusturma (Dockerfile)
- [ ] docker-compose.yml (API + Web + DB + Redis)
- [ ] Kubernetes manifest'leri (Helm chart)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] FLYX Cloud hizmeti (managed hosting)
  - [ ] Otomatik SSL
  - [ ] Otomatik scaling
  - [ ] Database yonetimi
  - [ ] Backup
  - [ ] Monitoring
- [ ] Self-hosted deploy (`flyx deploy --self-hosted`)
  - [ ] Docker compose olustur
  - [ ] Terraform scripts
- [ ] Multi-region deployment
- [ ] Blue-green deployment

---

## 13. WORKFLOW VISUAL DESIGNER (Oncelik: ORTA)

**Amac:** Drag-drop workflow tasarimi (web + desktop)

### Yapilacaklar:
- [ ] react-flow entegrasyonu
- [ ] Node tipleri:
  - [ ] Start / End
  - [ ] Decision (kosullu dallanma)
  - [ ] Approval (onay adimi)
  - [ ] Action (email gonder, kayit olustur)
  - [ ] Wait / Timer
  - [ ] Parallel (paralel isler)
- [ ] Edge (baglanti cizgileri) tipleri
- [ ] Property panel (secili node ozellikleri)
- [ ] FSL kod uretimi (visual → FSL)
- [ ] FSL kod onizleme
- [ ] Workflow test/simülasyon

---

## 14. REPORT VISUAL DESIGNER (Oncelik: ORTA)

**Amac:** Drag-drop rapor tasarimi

### Yapilacaklar:
- [ ] Column secici (entity field'larini listele)
- [ ] Filter builder (kosul ekleme)
- [ ] Parameter tanimlama (tarih araligi, dropdown)
- [ ] Gruplama/siralama ayarlari
- [ ] Chart tipleri (bar, line, pie, donut, area)
- [ ] Chart onizleme
- [ ] Tablo onizleme (mock data ile)
- [ ] Export secenekleri (PDF, Excel, CSV)
- [ ] FSL kod uretimi (visual → FSL)
- [ ] Scheduled reports (zamanlanmis rapor)

---

## 15. CODE GENERATOR REFACTORING (Oncelik: YUKSEK)

**Amac:** Code generator'i production-grade, extensible bir platfom motoruna donusturmek

**Dosya:** `packages/code-generator/`

### Adim 1: Core Architecture Refactoring
- [x] v1 calisiyor (6 generator, 17 test)
- [x] Paylasilan mantigi generator'lardan cikarildi (core/ dizini)
- [x] Base `Generator<TInput, TOutput>` interface (core/types.ts)
- [x] Yeni klasor yapisi olusturuldu

### Adim 2: Merkezi Type Mapper
- [x] `mapToTSType()` - FSL → TypeScript tipleri
- [x] `mapToValidatorDecorators()` - FSL → class-validator decorator'lari
- [x] `mapToInputType()` - FSL → HTML input tipleri
- [x] `collectValidatorImports()` - Tekrarsiz import toplama
- [x] String, Email, Number, Boolean, Enum, Relation, Array destegi

### Adim 3: Naming Engine (Pluralization Fix)
- [x] Dogru pluralization: category → categories, company → companies, box → boxes
- [x] `toPlural()`, `toSingular()`
- [x] `toControllerName()`, `toServiceName()`, `toStoreName()`, `toPageName()`
- [x] Entity naming: Customer → CustomersService, customerStore

### Adim 4: Template Engine
- [ ] EJS veya benzeri template engine entegrasyonu
- [ ] Inline string template'leri dosyalara tasi:
  ```
  templates/
    nestjs/controller.ejs
    nestjs/service.ejs
    nestjs/dto.ejs
    react/list-page.ejs
    react/form-modal.ejs
    react/store.ejs
  ```
- [ ] Generator'lar template dosyalarini kullansin

### Adim 4: Template Engine (CodeEmitter)
- [x] CodeEmitter sinifi (indent/dedent/block/each)
- [x] interpolate() ve dedent() yardimcilari

### Adim 5: Validation Engine
- [x] required → @IsNotEmpty()
- [x] Email → @IsEmail()
- [x] min/max → @Min(), @Max()
- [x] pattern → @Matches()
- [x] Enum values → @IsIn()
- [x] optional → @IsOptional()
- [x] generateDTOField() ve generateValidatorImports()

### Adim 6: Generator Strategy System
- [x] GeneratorEngine sinifi (registerGenerator + generate)
- [x] backend/frontend/skip secenekleri
- [x] Kosullu uretim (sadece backend, sadece frontend)

### Adim 7: Plugin System
- [x] `GeneratorPlugin` interface (beforeGenerate, afterGenerate hooks)
- [x] Dosya ekleme/degistirme desteği

### Adim 8: AST-Based Generation (ts-morph)
- [ ] ts-morph ile NestJS kod uretimi (string yerine AST)
- [ ] Tip-guvenli class olusturma
- [ ] Import yonetimi
- [ ] Method declaration
- [ ] React tarafini template-based birak

### Adim 9: Full Test Coverage
- [x] 51 test gecti (naming, type-mapper, validator, engine, emitter, generators)
- [x] Edge case testleri (optional fields, enum, relation)
- [x] Snapshot testler (8 snapshot yazildi)
- [x] Integration test (3 test - FSL → compile → generate → yapisal dogrulama)

### Adim 10: End-to-End Demo
- [x] Customer + Product + Order pipeline testleri
- [ ] Dokumantasyon guncelleme

---

## ONCELIK SIRASI

### Faz 1 - Cekirdek (TAMAM)
1. ~~Monorepo setup~~
2. ~~FSL Compiler~~
3. ~~Database Engine~~
4. ~~NestJS API~~
5. ~~React Web App~~
6. ~~Form Designer~~

### Faz 2 - Ekosistem (TAMAM)
7. ~~@flyx/cli build + test~~
8. ~~@flyx/ui build + test~~
9. ~~create-flyx-app build + test~~
10. ~~@flyx/code-generator v1 (6 generator, 17 test)~~

### Faz 2.5 - Code Generator Refactoring (TAMAM)
11. ~~Core architecture refactoring~~
12. ~~Type mapper + Naming engine~~
13. ~~Template engine + Validation engine~~
14. Plugin system + Strategy pattern
15. ~~AST-based generation (ts-morph) - 16 test~~
16. ~~Full test coverage - 78 test, 8 snapshot~~

### Faz 3 - Developer Experience (SIMDI)
17. ~~@flyx/desktop renderer tamamla (Entity Designer, Sidebar, Tabs, Transaction Codes)~~
18. @flyx/vscode extension
19. Workflow Visual Designer
20. Report Visual Designer
21. Transaction Code sistemi

### Faz 4 - AI & Moduller
22. @flyx/ai services
23. SAP module'leri (FI, SD, MM, PP, HR)

### Faz 5 - Platform
24. @flyx/mobile (React Native)
25. Integration packages
26. Cloud deploy
27. Module marketplace
