# ERP Dilleri Arastirmasi - FSL Icin Dersler

---

## 1. ABAP (SAP)

### Guclu Yonleri
- **Data Dictionary (DDIC)**: Merkezi veri sozlugu - tablo, domain, data element tek yerden yonetilir
- **LUW (Logical Unit of Work)**: Transaction butunlugu - ya hepsi ya hicbiri
- **Authorization Objects**: Cok detayli yetki kontrolu (alan bazinda)
- **Enhancement Points/BAdI**: Standart kodu bozmadan genisletme
- **ALV Grid**: Hazir raporlama framework'u (siralama, filtreleme, export)
- **Transport System**: Kod tasinma (DEV → QA → PROD)
- **Internal Tables**: Bellekte calisilan tablo yapisi (hizli islem)
- **Open SQL**: DB-bagimsiz SQL syntax

### Handikaplari (FSL'de OLMAYACAK)
- **Cok verbose syntax**: `DATA: lv_name TYPE string.` → FSL: `let name = ""`
- **Eski UI**: Dynpro/SAP GUI → FSL: React/Tailwind
- **Yavas upgrade**: Yillar suruyor → FSL: npm update
- **Pahali lisans**: Milyon dolarlar → FSL: acik kaynak
- **Yetenek azligi**: Az developer → FSL: web developer'lar kullanabilir
- **Test yazmak zor**: ABAP Unit karmasik → FSL: Vitest basit
- **Monolitik**: Her sey tek sistem → FSL: moduler (npm packages)
- **Debug zor**: SE80 breakpoint → FSL: browser DevTools
- **Versiyon kontrolu zayif**: Transport request → FSL: Git

### FSL'e Alinacaklar
```
ABAP DDIC        → FSL entity (zaten var)
ABAP LUW          → FSL transaction blogu (EKLENECEK)
ABAP Auth Objects  → FSL dinamik yetki matrisi (TAMAM)
ABAP BAdI          → FSL Plugin sistemi (TAMAM)
ABAP ALV           → FSL otomatik rapor/tablo (KISMEN)
ABAP Transport     → flyx deploy (YAPILACAK)
ABAP Internal Table → FSL Array tipi (VAR)
ABAP Open SQL      → FSL query() fonksiyonu (VAR)
```

---

## 2. 1C:Enterprise

### Guclu Yonleri
- **Visual programming**: Kod yazmadan form/rapor tasarimi
- **Bilingual**: Rus + Ingilizce syntax ayni anda desteklenir
- **Data Composition System (DCS)**: Cok guclu raporlama motoru
- **Managed forms**: UI otomatik olusturulur, sadece event handler yazilir
- **Query language**: SQL benzeri ama is mantigi odakli (TOTALS, PERIODS)
- **Configuration**: Tum yapilar (entity, form, rapor) tek metadata'da
- **Offline sync**: Dagitilmis veritabani, offline calisma
- **Desktop app**: Zengin masaustu uygulama

### Handikaplari (FSL'de OLMAYACAK)
- **Kapali ekosistem**: Sadece 1C icinde calisir → FSL: npm ekosistemi
- **OOP zayif**: Object-based, gercek OOP degil → FSL: full class/method destegi
- **Web destegi sinirli**: Temelde desktop → FSL: web-first
- **Tek vendor**: IAS'a bagimli → FSL: acik kaynak
- **Global yayginlik az**: Cogunlukla Rusya/CIS → FSL: global

### FSL'e Alinacaklar
```
1C Visual Design   → FSL Form Designer (TAMAM)
1C DCS             → FSL Report Designer + query language (KISMEN)
1C Managed Forms   → FSL otomatik form render (YAPILIYOR)
1C Configuration   → FSL module sistemi (TAMAM)
1C Offline         → FSL SQLite desteği (YAPILACAK)
1C Query Language  → FSL query() genisleme (YAPILACAK)
```

---

## 3. X++ (Microsoft Dynamics 365 Finance & Operations)

### Guclu Yonleri
- **.NET entegrasyonu**: C# kutuphaneleri direkt kullanilir
- **AOT (Application Object Tree)**: Tum nesneler agac yapisinda
- **RunBase framework**: Standart batch islem pattern'i
- **Security framework**: Role-based + duty-based + privilege-based
- **SysOperation**: Async islem framework'u
- **Inline SQL**: X++ icinde direkt SELECT/JOIN/WHERE
- **Table inheritance**: Tablo hiyerarsisi (entity inheritance)
- **Financial dimensions**: Cok boyutlu muhasebe destegi

### Handikaplari
- **Karmasik**: Ogrenme sureci uzun
- **Microsoft bagimli**: Azure zorunlu
- **Pahali**: Enterprise lisans

### FSL'e Alinacaklar
```
X++ Inline SQL      → FSL query() (VAR)
X++ Table Inheritance → FSL entity extends (EKLENECEK)
X++ Security Model   → FSL rol+gorev+yetki (KISMEN)
X++ Batch Framework  → FSL async workflow (YAPILACAK)
X++ AOT              → FSL module agaci (VAR - desktop sidebar)
X++ Dimensions       → FSL boyutlu muhasebe (YAPILACAK)
```

---

## 4. AL (Microsoft Dynamics 365 Business Central)

### Guclu Yonleri
- **VS Code entegrasyonu**: Modern IDE, extension olarak calisir
- **Pascal benzeri syntax**: Okunabilir, kolay ogrenilir
- **Table/Page/Codeunit**: Net nesne ayrimi
- **Triggers**: OnInsert, OnModify, OnDelete (entity seviyesinde)
- **Extension model**: Standart koda dokunmadan genisletme
- **Test framework**: Dahili test codeunit'leri
- **Permission sets**: Nesne bazinda yetki tanimlama

### Handikaplari
- **Sadece BC icin**: Diger platformlarda calismaz
- **Sinirli UI**: Web client sinirli

### FSL'e Alinacaklar
```
AL VS Code Extension → FSL VSCode Extension (TAMAM)
AL Triggers          → FSL triggers (TAMAM - ayni mantik!)
AL Extension Model   → FSL Plugin sistemi (TAMAM)
AL Permission Sets   → FSL yetki matrisi (TAMAM)
AL Table/Page        → FSL entity/form (TAMAM)
AL Test Framework    → FSL Vitest entegrasyonu (TAMAM)
```

---

## 5. Apex (Salesforce)

### Guclu Yonleri
- **Governor Limits**: Kaynak kontrolu - kotu kod sistemi cikertemez
- **Bulut-native**: Hicbir kurulum gerektirmez
- **Trigger framework**: before/after insert/update/delete (6 event)
- **SOQL**: Nesne bazli sorgu dili (SQL degil)
- **Batch Apex**: Buyuk veri islemleri icin async framework
- **Test coverage zorunlu**: %75 test olmadan deploy edilemez
- **Metadata API**: Tum yapilar programatik yonetilebilir

### Handikaplari
- **Governor limits cok kisitlayici**: 100 SOQL/transaction, 150 DML
- **Pahali**: Per-user lisans
- **Vendor lock-in**: Salesforce disinda calismaz

### FSL'e Alinacaklar
```
Apex Triggers        → FSL triggers (TAMAM - 6 event destegi)
Apex Governor Limits → FSL resource limits (EKLENECEK - opsiyonel)
Apex Test Zorunlulugu → FSL deploy oncesi test (YAPILACAK)
Apex Batch           → FSL async is akisi (YAPILACAK)
Apex SOQL            → FSL query dili (YAPILACAK)
Apex Metadata API    → FSL _meta endpoint'leri (TAMAM)
```

---

## 6. TROIA (Canias ERP - Turk Yapimi)

### Guclu Yonleri
- **4GL**: Cok az kodla is mantigi yazilir
- **Java tabanli**: Platform bagimsiz
- **500+ dahili komut**: Zengin fonksiyon kutuphanesi
- **Acik kaynak**: Kod gorulebilir ve degistirilebilir
- **Hizli ogrenme**: Teknik yetkinlik olan herkes kullanabilir
- **SOA mimarisi**: Web Services, HTTP, FTP, OPC entegrasyonu

### Handikaplari
- **Sinirli ekosistem**: Sadece Canias icinde
- **Dokumantasyon az**: Ingilizce kaynak sinirli
- **Topluluk kucuk**: SAP/Salesforce'a gore

### FSL'e Alinacaklar
```
TROIA 4GL            → FSL zaten 4GL (benzer felsefe)
TROIA Acik Kaynak    → FSL acik kaynak (TAMAM)
TROIA SOA            → FSL REST API (TAMAM)
TROIA 500+ Komut     → FSL builtin fonksiyonlar (GENISLETILECEK)
```

---

## KARSILASTIRMA MATRISI

| Ozellik | ABAP | 1C | X++ | AL | Apex | TROIA | FSL |
|---|---|---|---|---|---|---|---|
| Syntax | Verbose | Pascal | C# | Pascal | Java | 4GL | **Modern (TS benzeri)** |
| IDE | SE80 | 1C IDE | VS | VS Code | Web | TROIA IDE | **VS Code + Web** |
| Tip sistemi | Static | Dynamic | Static | Static | Static | Dynamic | **Static (compile-time)** |
| Trigger | Exit/BAdI | Event | X++ trigger | AL trigger | Apex trigger | Event | **FSL trigger (6 event)** |
| Raporlama | ALV | DCS | SSRS | Report | Salesforce | Report | **FSL Report Designer** |
| Test | ABAP Unit | ? | SysTest | Test CU | Apex Test | ? | **Vitest** |
| Deploy | Transport | Config | LCS | Extension | Metadata | Deploy | **flyx deploy** |
| Fiyat | $$$$ | $$ | $$$ | $$ | $$$ | $$ | **Ucretsiz** |
| Ogrenme | 6 ay | 2 ay | 3 ay | 1 ay | 2 ay | 1 ay | **1 hafta (hedef)** |
| Ekosistem | SAP only | 1C only | Azure | BC only | SF only | Canias | **npm (sinirssiz)** |

---

## FSL ICIN ALINACAK EN ONEMLI 10 OZELLIK

1. **Transaction/LUW blogu** (ABAP'tan): `transaction { ... }` ile atomik islemler
2. **Entity inheritance** (X++'tan): `entity PremiumCustomer extends Customer { ... }`
3. **Query language** (1C + Apex'ten): FSL icinde SQL benzeri ama is odakli sorgu
4. **Governor limits** (Apex'ten): Opsiyonel kaynak limiti - kotu kodu onleme
5. **Data Composition** (1C'den): Cok guclu dinamik raporlama
6. **Extension model** (AL'den): Standart modulleri bozmadan genisletme
7. **Test zorunlulugu** (Apex'ten): Deploy oncesi test coverage kontrolu
8. **Batch/Async** (X++ + Apex'ten): Buyuk veri islemleri icin async framework
9. **Financial dimensions** (X++'tan): Cok boyutlu muhasebe
10. **Offline sync** (1C'den): Dagitilmis calisma, sonra senkronizasyon

---

## KAYNAKLAR

- [ABAP Wikipedia](https://en.wikipedia.org/wiki/ABAP)
- [ABAP Cheat Sheets - SAP Samples](https://github.com/SAP-samples/abap-cheat-sheets)
- [ABAP Advantages and Disadvantages](https://www.yuhiro-global.com/advantages-and-disadvantages-of-abap-programming-language/)
- [1C Enterprise Programming Features](https://1csoftware.com/index.php/1c-enterprise-programming-language-features.html)
- [1C Query Language](https://1c-dn.com/library/query_language/)
- [X++ Language Reference](https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/dev-ref/xpp-language-reference)
- [AL Language for Developers](https://apiblog.cloudastra.co/2025/02/12/al-language-for-developers-microsoft-dynamics/)
- [Apex Governor Limits](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm)
- [Canias ERP Development - TROIA](https://canias.com/en/development/)
