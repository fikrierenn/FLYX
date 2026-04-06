# 1C:Enterprise → FLYX Platform Yapi Eslesmesi

## 1C:Enterprise Iki Uygulama Modeli

| 1C | FLYX | Amac |
|---|---|---|
| **1C:Configurator** | **FLYX Studio** (apps/web) | Gelistirici: entity/form/rapor tasarla, FSL kod yaz |
| **1C:Enterprise** | **FLYX ERP** (apps/erp) | Son kullanici: veri giris, belge olustur, rapor al |

---

## 1C Configuration Object Tipleri → FSL Karsiliklari

### TAMAMLANANLAR

| 1C Nesnesi | FSL Karsiligi | Durum | Aciklama |
|---|---|---|---|
| **Catalog** (Справочник) | `entity` | ✅ TAMAM | Ana veri: musteri, urun, depo, hesap plani |
| **Document** (Документ) | `document` | ✅ TAMAM | Belge: siparis, fatura, stok hareketi |
| **Accumulation Register** (Регистр накопления) | `register` | ✅ TAMAM | Birikim: stok bakiye, cari hesap |
| **Enumeration** (Перечисление) | `Enum` field type | ✅ TAMAM | Sabit deger listesi |
| **Report** (Отчет) | `report` | ✅ TAMAM | Rapor tanimlama |
| **Form** (Форма) | `form` | ✅ TAMAM | Ekran tasarimi |

### EKSIK - EKLENECEK

| 1C Nesnesi | FSL Karsiligi (YENI) | Oncelik | Aciklama |
|---|---|---|---|
| **Information Register** (Регистр сведений) | `info_register` | YUKSEK | Bilgi kaydi: kur, fiyat (tarihli/tarihsiz) |
| **Accounting Register** (Регистр бухгалтерии) | `accounting_register` | YUKSEK | Cifte kayit muhasebe: borc/alacak |
| **Chart of Accounts** (План счетов) | `chart_of_accounts` | YUKSEK | Hesap plani agaci |
| **Business Process** (Бизнес-процесс) | `workflow` (genislet) | ORTA | Is akisi - zaten var, genisletilmeli |
| **Task** (Задача) | `task` | ORTA | Gorev atama (workflow'a bagli) |
| **Data Processor** (Обработка) | `processor` | ORTA | Toplu islem (import, export, bakim) |
| **Constant** (Константа) | `constant` | DUSUK | Sistem sabitleri (firma adi, logo) |
| **Exchange Plan** (План обмена) | `exchange_plan` | DUSUK | Dagitik DB senkronizasyon |
| **Document Journal** (Журнал документов) | `journal` | DUSUK | Farkli belge tiplerini tek listede gorme |
| **Subsystem** (Подсистема) | `module` (mevcut) | ✅ TAMAM | Modul gruplama |

---

## 1C Configurator Agac Yapisi → FLYX Studio Sidebar

1C Configurator'daki Configuration agaci:

```
Configuration
├── Subsystems (Modüller)
│   ├── Sales
│   ├── Inventory
│   └── Finance
├── Constants
├── Catalogs
│   ├── Customer
│   ├── Product
│   └── Warehouse
├── Documents
│   ├── SalesOrder
│   ├── StockMovement
│   └── Invoice
├── Document Journals
├── Enumerations
├── Reports
│   ├── SalesReport
│   └── StockReport
├── Data Processors
├── Charts of Accounts
├── Information Registers
│   ├── ExchangeRates
│   └── PriceList
├── Accumulation Registers
│   ├── StockBalance
│   └── AccountBalance
├── Accounting Registers
├── Business Processes
└── Tasks
```

FLYX Studio'da ayni yapi:
```
FLYX Studio Sidebar
├── Moduller (Subsystems)
│   ├── Satis
│   ├── Stok
│   └── Finans
├── Entities (Catalogs)
│   ├── Customer
│   ├── Product
│   └── Warehouse
├── Documents
│   ├── SalesOrder
│   ├── StockMovement
│   └── Invoice
├── Registers
│   ├── StockBalance
│   └── AccountBalance
├── Reports
├── Forms
├── Workflows (Business Processes)
└── Tasks
```

---

## 1C Form Yapisi → FLYX Studio Form

1C'de bir form su elemanlardan olusur:

| 1C Form Elemani | FLYX Karsiligi | Aciklama |
|---|---|---|
| **Form Attributes** (Реквизиты) | FormSchema.fields | Form alanlari |
| **Form Elements** (Элементы) | FieldRenderer | Gorunur UI elemanlari |
| **Form Commands** (Команды) | ActionRenderer | Butonlar, menuler |
| **Form Parameters** | FormEngine props | Disardan gelen parametreler |
| **Group** (Группа) | SectionSchema | Alan gruplama |
| **Pages** (Страницы) | Tab'lar | Sekmeli gorunum |
| **Table** (Таблица) | GridRenderer | Tablo (master-detail) |
| **Command Bar** | ActionRenderer | Ust buton cubugu |
| **Decoration** | (EKLENECEK) | Etiket, cizgi, bosluk |

---

## 1C Event Model → FSL Trigger/Method

| 1C Event | FSL Karsiligi | Ne Zaman Calisir |
|---|---|---|
| **BeforeWrite** | `before_create` / `before_update` | Kayit oncesi |
| **OnWrite** | `after_create` / `after_update` | Kayit sonrasi |
| **BeforeDelete** | `before_delete` | Silme oncesi |
| **OnOpen** | (EKLENECEK) `on_open` | Form acildiginda |
| **OnClose** | (EKLENECEK) `on_close` | Form kapandiginda |
| **Posting** | (EKLENECEK) `on_post` | Belge kayit (muhasebe fisi) |
| **UndoPosting** | (EKLENECEK) `on_unpost` | Kayit geri alma |
| **FillCheckProcessing** | `validate` | Form dogrulama |

---

## 1C Tabular Section → FSL Master-Detail

1C'de her document/catalog "tabular section" icerebilir:

```
Document.SalesOrder
├── Header (baslik alanlari)
│   ├── OrderNo
│   ├── Customer
│   └── Date
└── TabularSection: Products (kalem alanlari)
    ├── Product
    ├── Quantity
    ├── Price
    └── Amount
```

FSL karsiligi (document + lines):
```fsl
document SalesOrder {
  fields { ... }           // Header
  lines: SalesOrderItem    // Tabular Section
  totals { ... }           // Alt toplamlar
}
```

---

## UYGULAMA PLANI

### Asama 1 (SIMDI): Studio'yu 1C Configurator gibi yap
- [ ] Sol sidebar: Configuration agaci (nesne tipine gore gruplu)
- [ ] Entity/Document/Register secince: ozellik paneli (1C'deki gibi)
- [ ] Form editor: 1C form designer gibi (zaten var, iyilestir)
- [ ] FSL kod editoru: her nesnenin FSL kodunu goster/duzenle

### Asama 2: Eksik nesne tiplerini ekle
- [ ] info_register (kur, fiyat tablosu)
- [ ] accounting_register (cifte kayit muhasebe)
- [ ] chart_of_accounts (hesap plani agaci)
- [ ] constant (sistem sabitleri)
- [ ] task (gorev yonetimi)

### Asama 3: ERP'yi 1C:Enterprise gibi yap
- [ ] Sol menu: moduller + alt menuler (1C benzeri)
- [ ] Belge listesi: journal gorunumu (farkli belgeler tek listede)
- [ ] Belge formu: baslik + tabular section + komut cubugu
- [ ] Rapor: parametre gir → sonuc tablosu + grafik

---

## KAYNAKLAR

- [1C Data Structure](https://1c-dn.com/library/data_structure_in_1c_enterprise_8/)
- [1C Development Concepts](https://support.1ci.com/hc/en-us/articles/360007971793)
- [1C Developer Guide](https://yellow-erp.com/page/guides/dev/concept-of-the-system/)
- [1C Wikipedia](https://en.wikipedia.org/wiki/1C:Enterprise)
