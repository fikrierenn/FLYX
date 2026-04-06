# FLYX Configuration DB Mimarisi

## Genel Bakis

FLYX'te tum nesne tanimlari (entity, document, register, form, report, workflow)
veritabaninda saklanir. Disk'te sabit FSL dosyasi YOKTUR (uretim ortaminda).

Bu, 1C:Enterprise'in Configuration DB yaklasiminin FLYX karsiligi.

---

## Hibrit Model

```
GELISTIRME (development):
  Developer → VSCode'da .fsl yazar → git commit
  flyx sync → disk'teki FSL'leri DB'ye yukler
  Configurator → DB'den okur, DB'ye yazar

URETIM (production):
  Configurator → DB'den okur, DB'ye yazar
  Her sey DB'de → disk'te dosya yok
  flyx export → DB'den diske backup alabilir
```

### Neden Hibrit?

| Sadece Disk | Sadece DB | Hibrit (bizim) |
|---|---|---|
| Git versiyonlama | Versiyon gecmisi DB'de | Her ikisi |
| IDE desteği | Configurator ile duzenleme | Her ikisi |
| Multi-tenant yok | Multi-tenant | Multi-tenant |
| Deploy = dosya kopyala | Deploy = DB backup | Her ikisi |
| Offline gelistirme | DB gerekli | Disk fallback |

---

## Veritabani Tablolari

### configuration_objects (Ana Tablo)

Her FSL nesnesi (entity, document, register, form...) bu tabloda bir satir.

| Sutun | Tip | Aciklama |
|---|---|---|
| id | UUID PK | Benzersiz ID |
| object_type | VARCHAR(50) | entity, document, register, form, report, workflow |
| name | VARCHAR(200) | Teknik ad (Customer, SalesOrder) |
| module | VARCHAR(100) | Modul (sales, inventory, finance) |
| fsl_code | TEXT | FSL kaynak kodu (tum tanimlama) |
| compiled_ast | JSONB | Derlenmis AST (cache - her seferinde derlememek icin) |
| metadata | JSONB | Ek bilgi (alan sayisi, bagimliliklari) |
| version | INTEGER | Versiyon (her degisiklikte +1) |
| is_active | BOOLEAN | Soft delete |
| locked_by | UUID | Kilitleyen kullanici |
| locked_at | TIMESTAMP | Kilitlenme zamani |
| tenant_id | UUID | Multi-tenant |
| created_by | UUID | Olusturan |
| created_at | TIMESTAMP | Olusturma zamani |
| updated_by | UUID | Son guncelleyen |
| updated_at | TIMESTAMP | Son guncelleme |

**Benzersizlik**: `(tenant_id, object_type, name)` - ayni tenant'ta ayni tipte ayni isim olamaz.

### configuration_history (Gecmis)

Her degisiklik kaydedilir. Versiyonlar arasi diff gorulebilir.

| Sutun | Tip | Aciklama |
|---|---|---|
| id | UUID PK | |
| object_id | UUID FK | Hangi nesne |
| version | INTEGER | Hangi versiyon |
| fsl_code | TEXT | O versiyondaki FSL kodu |
| compiled_ast | JSONB | O versiyondaki AST |
| change_description | VARCHAR(500) | Degisiklik aciklamasi |
| changed_by | UUID | Kim degistirdi |
| changed_at | TIMESTAMP | Ne zaman |
| tenant_id | UUID | |

### configuration_dependencies (Bagimliliklar)

Nesne bagimliliklari: Customer → SalesOrder (Relation ile bagli)

| Sutun | Tip | Aciklama |
|---|---|---|
| source_object_id | UUID FK | Bagli olan nesne |
| target_object_name | VARCHAR | Bagli olunan nesne adi |
| dependency_type | VARCHAR | relation, lines_entity, form_entity |

---

## API Endpoint'leri

| Method | Endpoint | Aciklama |
|---|---|---|
| GET | /v1/configuration/tree | Agac gorunumu (Configurator sidebar) |
| GET | /v1/configuration/objects | Filtrelenebilir liste |
| GET | /v1/configuration/objects/:id | Tek nesne detayi + FSL kodu |
| POST | /v1/configuration/objects | Yeni nesne olustur |
| PUT | /v1/configuration/objects/:id | FSL kodunu guncelle (versiyon artar) |
| DELETE | /v1/configuration/objects/:id | Soft delete |
| POST | /v1/configuration/seed | Disk FSL → DB yukle (ilk kurulum) |
| POST | /v1/configuration/migrate | Tablolari olustur |

---

## Veri Akisi

### 1. Ilk Kurulum (Seed)

```
packages/module-sales/src/entities/customer.fsl
                    ↓ POST /v1/configuration/seed
configuration_objects tablosu:
  {object_type: 'entity', name: 'Customer', module: 'sales',
   fsl_code: 'entity Customer { ... }', compiled_ast: {...}}
```

### 2. Configurator'da Duzenleme

```
Kullanici Configurator'da Customer acar
  → GET /v1/configuration/objects/:id
  → FSL kodu gosterilir
  → Kullanici alan ekler
  → PUT /v1/configuration/objects/:id {fsl_code: '...'}
  → Eski versiyon history'ye kaydedilir
  → Yeni FSL derlenir, AST guncellenir
  → Runtime'a bildirim: entity degisti, tabloyu guncelle
```

### 3. Runtime Entity Yuklemesi

```
API basladiginda:
  → configuration_objects tablosundan aktif nesneleri cek
  → Her birinin compiled_ast'ini kullan
  → DB tablolari olustur (CREATE TABLE IF NOT EXISTS)
  → CRUD endpoint'leri kayit et
  → Trigger'lari bagla
```

### 4. Multi-Tenant Izolasyon

```
Tenant A: configuration_objects WHERE tenant_id = 'aaa'
  → Customer (12 alan), SalesOrder (11 alan), ...

Tenant B: configuration_objects WHERE tenant_id = 'bbb'
  → Customer (15 alan - farkli yapilar!), Invoice (8 alan), ...
```

Her tenant kendi entity yapilarina sahip. Tenant A'nin Customer'i 12 alanli,
Tenant B'ninki 15 alanli olabilir.

---

## Cache Stratejisi

```
Istek gelir → Cache'de var mi?
  EVET → Cache'den don (hizli)
  HAYIR → DB'den oku → Cache'e yaz → Don

Nesne guncellendiginde:
  → Cache invalidate (o nesne icin)
  → Runtime'a bildirim (tablo guncelle)
```

Cache TTL: 5 dakika (development), 30 dakika (production)
Cache key: `config:{tenant_id}:{object_type}:{name}`

---

## Kilit Mekanizmasi (Locking)

Ayni nesneyi iki kisi ayni anda duzenleyemesin:

```
Kullanici A Customer'i acar:
  → UPDATE configuration_objects SET locked_by = 'userA', locked_at = NOW() WHERE id = ?
  → Kullanici B acarsa: "Bu nesne Kullanici A tarafindan duzenleniyor" mesaji

Kullanici A kaydeder veya cikar:
  → UPDATE configuration_objects SET locked_by = NULL, locked_at = NULL WHERE id = ?

5 dakikadan uzun kilitli kalirsa:
  → Kilit otomatik kalkar (stale lock)
```

---

## Seed vs Runtime Farki

| Islem | Seed (ilk yukle) | Runtime (calisirken) |
|---|---|---|
| Kaynak | Disk (.fsl dosyalari) | DB (configuration_objects) |
| Ne zaman | `flyx sync` komutu | API basladiginda |
| Derle | Evet (FSL → AST) | Hayir (compiled_ast cache) |
| Tablo olustur | Evet | Evet (IF NOT EXISTS) |
| Uzerine yaz | Hayir (varsa atla) | - |

---

## Guvenlik

- **Tenant izolasyon**: Her sorgu `WHERE tenant_id = ?` icermeli
- **Yetki kontrolu**: Sadece admin konfigurasyonu degistirebilir
- **Audit log**: Her degisiklik history tablosuna yazilir
- **Kilit**: Ayni anda iki kisi duzenleyemez
- **Validasyon**: FSL derlenebilir olmali (syntax hatasi → kaydetme engellenir)

---

## CLI Komutlari

```bash
flyx sync          # Disk'teki FSL dosyalarini DB'ye yukle
flyx export        # DB'den disk'e FSL dosyalari olarak yaz
flyx migrate       # DB tablolarini olustur
flyx validate      # Tum FSL kodlarini derleyerek dogrula
flyx diff           # Disk vs DB arasindaki farklari goster
```
