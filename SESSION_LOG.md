# FLYX Platform - Session Log & Architecture Decisions

Bu dosya, FLYX Platform gelistirme surecindeki tum kararlar, mimari yapilar,
mantiklar ve ogrenimleri icerir. Gelecek session'larda referans olarak kullanilir.

---

## TEMEL FELSEFE

### FSL = ABAP Benzeri DSL
- FSL, SAP'taki ABAP'in FLYX karsiligi
- Kullanici FSL yazar → Platform otomatik SQL + API + UI uretir
- Is mantigi (hesaplama, trigger, workflow) FSL'de tanimlanir, TS'de degil
- Platform motoru TS, is uygulamasi FSL

### Vizyon
```
SAP'in gucu + 1C'nin kolayligi + modern stack + AI-native + npm ekosistemi
```

---

## MIMARI KARARLAR

### 1. Monorepo Yapisi (Turborepo)
- packages/: paylasilan kutuphaneler
- apps/: uygulamalar (api, web)
- Her paket bagimsiz build/test
- Dependency graph: fsl-compiler → database-engine → code-generator → api/web

### 2. FSL Compiler Pipeline
```
FSL Kaynak → Lexer (Chevrotain) → Token[] → Parser (CstParser) → CST
→ Visitor (CSTToASTVisitor) → AST → Code/SQL Generation
```
- 97 token, 58 parser kurali, 35+ AST node tipi
- longer_alt mekanizmasi: keyword'ler Identifier'dan ayirt edilir
- propertyName kurali: keyword'ler form/report icinde property adi olabilir

### 3. Multi-Tenant
- Her tabloda `tenant_id UUID NOT NULL`
- TenantMiddleware: subdomain veya X-Tenant-ID header
- TenantGuard: kullanici tenant_id esleme
- Varsayilan tenant UUID: 00000000-0000-0000-0000-000000000001

### 4. Yetki Sistemi
- Sadece "admin" varsayilan rol (hardcoded roller KALDIRILDI)
- Ilk kayit olan kullanici otomatik admin
- Sonraki kullanicilar rolsuz baslar, admin atar
- Dinamik yetki matrisi: rol × entity × aksiyon (CRUD)
- FSL permissions → ilk varsayilan, sonra UI'dan degistirilebilir

### 5. Code Generator Architecture
- core/naming/: Pluralization (category→categories, box→boxes)
- core/type-mapper/: FSL→TS, FSL→HTML input, FSL→validator
- core/validation/: DTO decorator uretimi
- core/emitter/: CodeEmitter (sifir bagimllik template engine)
- core/generator-engine.ts: Strategy + Plugin pattern
- generators/nestjs/: String-based NestJS (controller, service, DTO)
- generators/nestjs-ast/: ts-morph AST-based NestJS
- generators/react/: React (list page, form modal, store)
- V1 generator'lar core/ modullerini kullaniyor (migration tamamlandi)

### 6. Runtime Engine (ABAP Runtime benzeri)
```
FSL methods/triggers → RecordContext (this nesnesi) → ExpressionExecutor
→ StatementExecutor → TriggerExecutor → BuiltinFunctions
```
- before_create/after_create/before_update trigger'lari
- Computed field hesaplama
- Dahili fonksiyonlar: query(), send_email(), now(), round()
- RuntimeService CRUD'da trigger'lari otomatik calistirir

### 7. Runtime Entity Loader (Calisan Zincir)
```
.fsl dosyasi → compile → AST → SQL → PostgreSQL tablo
                              → CRUD endpoint kayit
                              → yetki matrisi yukle
                              → trigger/method calisir
```
- API basladiginda packages/module-* dizinlerini tarar
- Her .fsl dosyasini derler, tablo olusturur
- /v1/data/:entity dinamik CRUD endpoint'leri

---

## MODUL ISIMLENDIRMESI (SAP → FLYX)

| SAP | FLYX | Kisaltma |
|---|---|---|
| FI | @flyx/module-finance | FIN |
| CO | @flyx/module-controlling | CTL |
| SD | @flyx/module-sales | SLS |
| MM (stok) | @flyx/module-inventory | INV |
| MM (satinalma) | @flyx/module-procurement | PRC |
| WM | @flyx/module-wms | WMS |
| PP | @flyx/module-production | PRD |
| QM | @flyx/module-quality | QMS |
| HR | @flyx/module-hr | HR |
| CRM | @flyx/module-crm | CRM |
| CS | @flyx/module-service | SVC |
| TR | @flyx/module-treasury | TRS |
| FI-AA | @flyx/module-fixedassets | FXA |
| TM | @flyx/module-logistics | LOG |
| PS | @flyx/module-projects | PRJ |
| - | @flyx/module-contracts | CNT |
| - | @flyx/module-fleet | FLT |
| - (TR) | @flyx/module-einvoice | EIN |
| - (TR) | @flyx/module-eledger | ELG |
| RE | @flyx/module-realestate | REM |
| PM | @flyx/module-assets | AST |
| - | @flyx/module-pos | POS |
| - | @flyx/module-subscription | SUB |
| BI/BW | @flyx/module-analytics | ANL |

**Kural: SAP modul adlarini oldugu gibi kullanma, FLYX'e ozel isimlendir. Ama zoraki degistirme de yapma (PP→PRD degil MFG, HR→HR kalsin).**

---

## UI/UX STANDARTLARI

- Navbar: sticky top-0 z-40 shadow-sm h-14
- Sayfa basligi: h1 text-2xl font-bold
- Panel basliklari: text-xs font-semibold text-gray-500 uppercase tracking-wider
- 3-panel layout: sol border-r, orta bg-gray-50, sag border-l
- FSL panel: bg-gray-900 text-green-400 + "Kopyala" butonu
- Butonlar: primary=blue-600, danger=red-600, success=green-600
- Tablo: bg-gray-50 header, divide-y body, hover:bg-gray-50
- Badge: rounded-full text-xs font-medium
- Bos durum: emoji + mesaj

---

## ERP EKRANI KURALLARI

- ERP ekranlari platform tasarimcisindan (Form Designer) BAGIMSIZ
- Master-detail form: baslik (header) + satirlar (line items)
- Otomatik hesaplama: miktar × birim fiyat - iskonto + KDV
- Belge numaralama: SIP-2026-0001 pattern
- Durum gecisleri: draft → confirmed → shipped → delivered (geri alinamaz)
- Iptal: sadece draft veya confirmed durumdan
- Lookup: Musteri/Urun arama dropdown
- Toplamlar: Ara Toplam, Iskonto, KDV, Genel Toplam

---

## FSL EKSIKLERI (BILINEN)

### Tamamlandi
- [x] Dashboard parser
- [x] on_update/on_delete workflow trigger
- [x] Lookup/DateRange type mapping
- [x] Validation onCreate/onUpdate visitor
- [x] ConditionalDisplay AST

### Kalan (Runtime Engine gerektirir)
- [ ] Computed expression evaluation (sifir bagimllik)
- [ ] File/Image validation codegen
- [ ] query() safety (SQL injection onleme)
- [ ] send_email/send_sms implementation
- [ ] current_user() function
- [ ] FSL'den otomatik ERP ekrani render (master-detail)

---

## KRITIK ALTYAPI DURUMU

| Ozellik | Durum |
|---|---|
| PostgreSQL baglanti | TAMAM (connection pool, transaction) |
| Kullanici yonetimi | TAMAM (bcrypt, JWT refresh) |
| Yetki matrisi | TAMAM (dinamik, UI ile) |
| Ortam konfigurasyonu | TAMAM (.env, @nestjs/config) |
| Audit log | TAMAM (interceptor, endpoint) |
| Guvenlik | TAMAM (helmet, rate limit, CORS, error filter, health check) |
| Runtime trigger | TAMAM (before/after create/update) |
| ERP ekrani | TAMAM (SalesOrder master-detail) |

---

## TEST DURUMU

| Paket | Test Sayisi |
|---|---|
| fsl-compiler | 17 |
| database-engine | 8 |
| code-generator | 78 (5 dosya, 8 snapshot) |
| **Toplam** | **103** |

---

## COMMIT GECMISI (OZETLER)

1. Initial release (11 paket, 26K satir)
2. Desktop renderer (1C benzeri UI)
3. Snapshot + integration testler
4. VSCode extension (syntax, snippets, diagnostics)
5. Skills (react, nestjs, fsl, code-generator, desktop, ui-ux)
6. UI/UX standartlari + duzeltmeler
7. README.md
8. Code generator V1→core migration
9. FSL compiler gap fixes (dashboard, triggers, types)
10. Kritik altyapi (DB, auth, security, config)
11. Audit log + login/register UI
12. Dinamik yetki matrisi
13. Hardcoded roller temizleme
14. 7 is modulu (57 FSL dosyasi)
15. Runtime entity loader (calisan zincir)
16. FSL Runtime Engine (ABAP benzeri trigger/method)
17. Satis siparisi ERP ekrani (master-detail)

---

## ONEMLI KARARLAR LOG

1. **EJS yerine CodeEmitter**: Sifir bagimllik, paket boyutu kucuk
2. **bcrypt yerine bcryptjs**: Native build hatasi (Windows), pure JS tercih
3. **Sadece admin varsayilan rol**: Diger roller UI'dan olusturulur
4. **Ilk kullanici admin**: Sonrakiler rolsuz baslar
5. **Dev modda auth bypass**: API olmadan sayfalari gormek icin
6. **FSL is mantigi TS degil**: calculate(), trigger'lar FSL'de tanimlanir
7. **ERP ekranlari platform'dan bagimsiz**: Generic CRUD degil, ozel sayfalar
8. **Tenant UUID**: String "default" degil, gercek UUID kullan
9. **Modul isimlendirme**: SAP'i birebir kopyalama, FLYX'e ozel ama dogal isimler
10. **Satinalma ve stok ayri**: SAP MM → INV (stok) + PRC (satinalma) + WMS (depo)

---

## SONRAKI SESSION: ABAP + RAKIP DIL ARASTIRMASI

Sabah yapilacak: ABAP ve benzer ERP dilleri hakkinda derin arastirma.

### Arastirilacak Diller:
1. **ABAP** (SAP) - Handikaplari, gucleri, syntax, runtime, transport system
2. **1C:Enterprise Language** (1C) - Visual programming, form engine, query language
3. **X++** (Microsoft Dynamics 365 / AX) - .NET tabanli, AOT, data access
4. **AL** (Microsoft Dynamics 365 Business Central) - Modern, VS Code entegrasyonlu
5. **PeopleCode** (Oracle PeopleSoft) - Event-driven, Component Processor
6. **ABSL/CDL** (SAP Business ByDesign) - ABAP'in bulut versiyonu
7. **Apex** (Salesforce) - Java benzeri, governor limits, bulut-native
8. **iasScript** (Canias ERP) - Turk yapimi ERP dili

### Arastirilacak Konular:
- Her dilin syntax ozellikleri ve FSL'e neler alinabilir
- ABAP handikaplari ve FSL'de nasil cozulecegi
- Transaction yonetimi (LUW kavrami)
- Enhancement/Exit noktalari (genisletilebilirlik)
- Raporlama dili (ABAP ALV, 1C Data Composition)
- Yetkilendirme modeli (SAP auth objects vs FSL permissions)
- Veri sozlugu (ABAP DDIC vs FSL entity)
- Belge akisi (siparis→irsaliye→fatura zinciri nasil tanimlanir)
- Form tasarimi (SAPScript, SmartForms, Adobe Forms vs FSL Forms)
- Performans: N+1, buffering, lazy loading

### Hedef:
FSL'i sadece "bir DSL" degil, ABAP/X++/AL seviyesinde guclu bir ERP dili yapmak.
Handikaplari almadan, gucleri alarak.
