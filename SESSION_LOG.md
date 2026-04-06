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

### Arastirma TAMAMLANDI:
Detay: docs/ERP_LANGUAGE_RESEARCH.md (6 dil, karsilastirma matrisi, FSL icin 10 ozellik)

---

## MIMARI KARAR: FORM RENDER STRATEJISI

**Soru:** Buyuk projelerde her seferinde FSL'den dinamik form render etmek performans sorunu olur mu?
**Cevap:** Evet. ABAP'ta formlar (Dynpro) onceden derlenir, runtime'da sadece yuklenirler.

### 3 Katmanli Strateji (ABAP + 1C hibrit):

| Katman | Ne Zaman | Nasil | ABAP Karsiligi |
|---|---|---|---|
| **Build-time** | `flyx build` | FSL → React component dosyalari uretilir, diske yazilir | ABAP aktivasyon (SE51) |
| **Cache** | API basladiginda | FSL derlenir, AST bellekte tutulur, tekrar derlenmez | ABAP LOAD tablosu |
| **Dynamic** | Sadece gelistirme | Her istekte FSL okunur + derlenir | 1C managed forms |

### Uygulama Plani:
1. RuntimeService'de AST cache'i zaten var (entities Map'i)
2. Eksik: `flyx build` ile React component dosyalari uretme (code-generator kullanarak)
3. Eksik: Uretilmis dosyalari web app'e import etme
4. Eksik: Hot-reload (dev modda FSL degisince ekran aninda guncellensin)

### Performans Hedefleri:
- Build-time: FSL derleme + kod uretme < 5 saniye (100 entity icin)
- Runtime cache: Ilk yuklemede FSL derle, sonra bellekten oku
- Sayfa acilisi: < 200ms (onceden uretilmis component)
- Dev mode: FSL degisiklik → ekran guncelleme < 1 saniye

---

## KRITIK KARAR: 1C NESNE YAPISI → FSL

1C'nin nesne modeli FSL'e uyarlanacak:

| 1C Nesnesi | FSL Karsiligi | Aciklama |
|---|---|---|
| Catalog | `entity` (mevcut) | Ana veri (musteri, urun, depo) |
| Document | `document` (YENI) | Belge (siparis, fatura) - numaralama + durum + satirlar |
| Register | `register` (YENI) | Hareket (stok, cari, muhasebe) - boyut + kaynak + bakiye |
| Report | `report` (mevcut) | Rapor |
| Form | `form` (mevcut) | Ekran - 1C gibi runtime duzenlenebilir |
| Enum | Enum tipi (mevcut) | Sabit deger listesi |

### Document Syntax:
```fsl
document SalesOrder {
  numbering: "SIP-{YYYY}-{SEQ:4}"
  status_flow: draft → confirmed → shipped
  header {
    customer: Relation(Customer) { required }
    order_date: Date { required }
  }
  lines {
    entity: SalesOrderItem
    fields: ["product", "quantity", "unit_price", "tax_rate", "net_total"]
  }
  totals {
    subtotal: sum("line_total")
    tax: sum("tax_amount")
    grand_total: sum("net_total")
  }
}
```

### Register Syntax:
```fsl
register StockBalance {
  dimensions: [product, warehouse]
  resources: [quantity]
  // Otomatik bakiye: giris - cikis = kalan
}
```

## KRITIK KARAR: FORM RENDERER (1C BENZERI)

TSX ile ERP ekrani YAZILMAYACAK. Tum ekranlar FSL'den render edilecek.
Ekranlar 1C gibi runtime'da duzenlenebilir olacak.

### Renderer Yapisi:
```
packages/form-renderer/
  engine/FormEngine.ts       - FSL Form → React render
  engine/FieldRenderer.tsx   - Alan tiplerine gore input
  engine/GridRenderer.tsx    - Kalem tablosu (master-detail)
  engine/TotalsRenderer.tsx  - Alt toplamlar
  engine/ActionRenderer.tsx  - Butonlar + durum gecisi
  engine/MenuBuilder.ts      - FSL modullerden otomatik menu
  designer/FormCustomizer.tsx - 1C benzeri runtime duzenleme
  hooks/useFormData.ts       - Form state
  hooks/useTrigger.ts        - FSL trigger calistirma
  hooks/useLookup.ts         - Relation arama
  hooks/usePermission.ts     - Yetki kontrolu
```

## TAMAMLANAN (Session 3)

1. ✅ FSL'e `document` ve `register` keyword eklendi
2. ✅ FLYX Studio paketi olusturuldu (packages/studio)
3. ✅ FormEngine: FSL schema → React otomatik render
4. ✅ FieldRenderer, GridRenderer, TotalsRenderer, ActionRenderer
5. ✅ SchemaBuilder: API schema → FormSchema donusumu
6. ✅ ERP app Studio ile baglandi (StudioPage - tum ekranlar FSL'den)
7. ✅ FormCustomizer: 1C benzeri runtime ekran duzenleme
8. ✅ Sidebar gruplu menu (Satis, Stok, Satinalma, Finans)

---

## KRITIK KARAR: FRAMEWORK BAGIMSIZLIGI

**Endise:** React/TS versiyonu degisirse ne olacak?

**Cozum:** FSL degismez - altindaki renderer degisebilir.
```
FSL (kalici, 10+ yil) → Renderer (degisebilir) → Ekran
```

**Mimari kural:**
- FormEngine is mantigi (schema, totals, actions) → framework-agnostic
- FieldRenderer, GridRenderer → React-specific (ileride degisebilir)
- Kullanici sadece FSL gorunur, React gizli
- ABAP modeli: ABAP 40 yildir ayni, runtime 10 kez degisti

**Ileride yapilabilecek:**
```
FormEngine (ayni)
  → ReactRenderer (simdi)
  → SolidRenderer (gelecekte)
  → NativeRenderer (mobil icin)
```

Simdi soyutlama YAPMA (overengineering). Ama is mantigi ve render'i karistirma.

---

## TAMAMLANAN (Session 4)

1. ✅ Stok belgeleri: PurchaseReceipt, SalesDelivery, TransferOrder, StockCount + kalemleri
2. ✅ Fatura belgeleri: SalesInvoice, PurchaseInvoice + kalemleri
3. ✅ FLYX Studio Configurator (1C benzeri gorunum - toolbar, agac, tablar)
4. ✅ Studio core soyutlama (FormController, RenderAdapter, types)
5. ✅ Configuration DB mimarisi (configuration_objects, history, dependencies)
6. ✅ ConfigurationService (CRUD, seed, tree, locking)

---

## KRITIK KARAR: CONFIGURATION DB MIMARISI

**Karar:** Tum nesne tanimlari DB'de saklanir (disk'te sabit dosya yok).

**Model: HIBRIT**
- Gelistirme: disk'te .fsl yaz → `flyx sync` → DB'ye yukle
- Uretim: Configurator → DB'den oku/yaz → versiyon gecmisi
- Her tenant kendi konfigurasyonunu DB'de saklar (multi-tenant)

**Tablolar:**
- `configuration_objects` - ana tablo (fsl_code, compiled_ast, metadata)
- `configuration_history` - versiyon gecmisi (her degisiklik kaydedilir)
- `configuration_dependencies` - nesne bagimliliklari

**Detay:** docs/CONFIGURATION_DB_ARCHITECTURE.md

---

## KRITIK KARAR: BELGE ZINCIRI

Stok hareketi dogrudan girilmez - belgelerden olusur:

```
ALIS:  PurchaseOrder → PurchaseReceipt (stok+) → PurchaseInvoice (cari borc)
       Fiyat farki varsa → PriceDifferenceInvoice (adet ayni, fiyat farkli)

SATIS: SalesOrder → SalesDelivery (stok-) → SalesInvoice (cari alacak)
       Iade varsa → ReturnInvoice (stok+, cari borc-)

STOK:  TransferOrder (depo arasi), StockCount (sayim farki)
```

**Posting mekanizmasi:** Belge "kayit edilir" → register'a hareket olusur.
Dogrudan register'a kayit YAZILMAZ.

---

## SONRAKI ADIMLAR

1. RuntimeService'i DB'den yukleyecek sekilde guncelle
2. Configurator'i gercek API'ye bagla (mock data kaldir)
3. ERP sidebar'i DB'den dinamik yukle
4. Posting mekanizmasi (belge kayit → register hareket)
5. Fiyat farki faturasi
6. Satis/satinalma sartlari kontrolu
