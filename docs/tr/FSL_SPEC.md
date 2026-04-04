# FSL (FLYX Script Language) - Dil Spesifikasyonu

**Versiyon:** 0.1.0
**Son Guncelleme:** 2026-04-04

---

## 1. Genel Bakis

FSL (FLYX Script Language), is uygulamalarini tanimlamak icin tasarlanmis bir Domain-Specific Language (DSL) dilidir. FSL ile entity (varlik), form, rapor ve is akisi (workflow) tanimlari yazilir. Platform bu tanimlardan otomatik olarak:

- PostgreSQL tablo semalari (CREATE TABLE)
- REST API endpoint'leri (CRUD)
- Web UI bilesenlerini (form, tablo, rapor)

uretir.

---

## 2. Dosya Yapisi

FSL dosyalari `.fsl` uzantisi ile kaydedilir:

```
src/
  entities/customer.fsl
  forms/customer-form.fsl
  reports/sales-report.fsl
  workflows/invoice-approval.fsl
```

---

## 3. Yorumlar (Comments)

```fsl
// Tek satirlik yorum

/*
   Cok satirlik
   yorum
*/
```

Yorumlar lexer tarafindan otomatik atlanir (`Lexer.SKIPPED`).

---

## 4. Tanimlamalar (Declarations)

FSL'de 5 ust-duzey tanimlama tipi vardir:

| Tanimlama | Keyword | Aciklama |
|---|---|---|
| Entity | `entity` | Veritabani varligi (tablo) |
| Form | `form` | Kullanici arayuzu formu |
| Report | `report` | Veri raporu |
| Workflow | `workflow` | Is akisi |
| Dashboard | `dashboard` | Gosterge paneli |

Ayrica bir `module` keyword'u ile birden fazla tanimlama gruplanabilir:

```fsl
module "FLYX:ERP" {
  version: "1.0.0"
  dependencies: ["FLYX:Platform"]

  entity Customer { ... }
  form CustomerForm { ... }
}
```

---

## 5. Entity (Varlik) Tanimlama

Entity, veritabanindaki bir tabloyu temsil eder.

### 5.1 Temel Yapi

```fsl
entity Customer {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    email: Email { unique }
  }
}
```

### 5.2 Entity Bloklari

Bir entity icinde su bloklar kullanilabilir:

| Blok | Keyword | Aciklama |
|---|---|---|
| Alanlar | `fields` | Tablo sutunlari |
| Metodlar | `methods` | Hesaplama/is mantigi |
| Yetkiler | `permissions` | CRUD erisim kontrolleri |
| Tetikleyiciler | `triggers` | Olay bazli otomatik isler |
| Validasyon | `validation` | Ozel dogrulama kurallari |

### 5.3 Tam Entity Ornegi

```fsl
entity Customer {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    email: Email { unique }
    phone: Phone
    credit_limit: Decimal(12,2) { default: 0 }
    status: Enum {
      values: ["active", "inactive", "blocked"],
      default: "active"
    }
    category: Relation(Category) { required }
  }

  methods {
    get_total_sales() {
      return query("SELECT SUM(total) FROM sales WHERE customer_id = {this.id}");
    }
  }

  permissions {
    create: ["sales_manager", "admin"]
    read: ["sales_rep", "sales_manager", "admin"]
    update: ["sales_manager", "admin"]
    delete: ["admin"]
  }

  triggers {
    after_create {
      send_email({
        to: this.email,
        template: "welcome"
      });
    }
  }
}
```

---

## 6. Veri Tipleri (Data Types)

### 6.1 Temel Tipler (Primitive)

| FSL Tipi | PostgreSQL Karsiligi | Parametreler | Ornek |
|---|---|---|---|
| `String` | `VARCHAR(n)` | Uzunluk (varsayilan: 255) | `name: String(200)` |
| `Number` | `INTEGER` | - | `age: Number` |
| `Decimal` | `DECIMAL(p,s)` | Precision, Scale (varsayilan: 10,2) | `price: Decimal(12,2)` |
| `Boolean` | `BOOLEAN` | - | `is_active: Boolean` |
| `Date` | `DATE` | - | `birth_date: Date` |
| `DateTime` | `TIMESTAMP` | - | `created_at: DateTime` |
| `Text` | `TEXT` | - | `description: Text` |
| `JSON` | `JSONB` | - | `metadata: JSON` |

### 6.2 Ozellestirilmis Tipler (Specialized)

| FSL Tipi | PostgreSQL Karsiligi | Dahili Dogrulama | Ornek |
|---|---|---|---|
| `Email` | `VARCHAR(255)` | Email format | `email: Email` |
| `Phone` | `VARCHAR(255)` | Telefon format | `phone: Phone` |
| `URL` | `VARCHAR(255)` | URL format | `website: URL` |
| `Money` | `DECIMAL(15,2)` | Para birimi | `total: Money` |

### 6.3 Karmasik Tipler (Complex)

#### Enum

```fsl
status: Enum {
  values: ["active", "inactive", "blocked"],
  default: "active"
}
```

PostgreSQL karsiligi: `VARCHAR(100)` + uygulama katmaninda dogrulama.

#### Relation (Iliski)

```fsl
// Bire-cok iliski
customer: Relation(Customer) { required }

// Coka-cok iliski
tags: Relation(Tag) { many: true }
```

PostgreSQL karsiligi: `UUID` + `FOREIGN KEY` constraint.

#### File ve Image

```fsl
avatar: File { accept: ["image/*"], maxSize: "5MB" }
photo: Image { maxWidth: 1024, maxHeight: 1024 }
```

PostgreSQL karsiligi: `VARCHAR(500)` (dosya yolu saklanir).

#### Array

```fsl
tags: Array(String)
prices: Array(Decimal)
```

PostgreSQL karsiligi: `JSONB`.

#### Computed (Hesaplanmis)

```fsl
full_name: Computed {
  expression: "{first_name} {last_name}"
}
```

Computed alanlar veritabaninda saklanmaz, calisma zamaninda hesaplanir.

#### Lookup

```fsl
customer: Lookup(Customer) { optional: true }
```

Rapor parametrelerinde kullanilir.

#### DateRange

```fsl
date_range: DateRange { default: "this_month" }
```

Rapor parametrelerinde tarih araligi filtresi.

---

## 7. Constraint'ler (Kisitlamalar)

Constraint'ler field tanimindan sonra `{ }` icinde belirtilir:

```fsl
field_name: DataType { constraint1, constraint2: value }
```

### 7.1 Tum Constraint'ler

| Constraint | Deger | PostgreSQL Karsiligi | Ornek |
|---|---|---|---|
| `required` | - | `NOT NULL` | `name: String { required }` |
| `unique` | - | `UNIQUE` | `email: Email { unique }` |
| `indexed` | - | `CREATE INDEX` | `code: String { indexed }` |
| `default` | any | `DEFAULT value` | `status: String { default: "active" }` |
| `min` | number | Uygulama katmani | `age: Number { min: 0 }` |
| `max` | number | Uygulama katmani | `age: Number { max: 150 }` |
| `pattern` | string | Uygulama katmani | `code: String { pattern: "[A-Z]{3}" }` |
| `optional` | - | Nullable (NOT NULL degil) | `note: Text { optional: true }` |
| `many` | boolean | Coka-cok iliski | `tags: Relation(Tag) { many: true }` |
| `values` | string[] | Enum degerleri | `status: Enum { values: ["a","b"] }` |
| `accept` | string[] | Dosya tipleri | `file: File { accept: ["image/*"] }` |
| `maxSize` | string | Dosya boyutu | `file: File { maxSize: "5MB" }` |
| `expression` | string | Computed ifade | `full: Computed { expression: "..." }` |

### 7.2 Birden Fazla Constraint

```fsl
code: String(50) { required, unique, indexed }
price: Decimal(12,2) { required, min: 0, default: 0 }
```

---

## 8. Methods (Metodlar)

Entity'ye is mantigi eklemek icin kullanilir:

```fsl
methods {
  get_total_sales() {
    return query("SELECT SUM(total) FROM sales WHERE customer_id = {this.id}");
  }

  calculate_discount(rate: Number) {
    let discount = this.total * rate;
    return discount;
  }
}
```

### 8.1 Dahili Fonksiyonlar

| Fonksiyon | Aciklama | Ornek |
|---|---|---|
| `query()` | SQL sorgusu calistir | `query("SELECT ...")` |
| `send_email()` | Email gonder | `send_email({ to: "...", template: "..." })` |
| `send_sms()` | SMS gonder | `send_sms({ to: "...", message: "..." })` |
| `create()` | Kayit olustur | `create(Invoice, { ... })` |
| `update()` | Kayit guncelle | `update(this, { status: "done" })` |
| `delete()` | Kayit sil | `delete(this)` |

---

## 9. Permissions (Yetkiler)

CRUD (Create, Read, Update, Delete) bazli erisim kontrolleri:

```fsl
permissions {
  create: ["admin", "sales_manager"]
  read: ["admin", "sales_manager", "sales_rep"]
  update: ["admin", "sales_manager"]
  delete: ["admin"]
}
```

Her islem icin bir veya daha fazla rol belirtilir. Belirtilmeyen islemler varsayilan olarak `["admin"]` rolune aciktir.

---

## 10. Triggers (Tetikleyiciler)

Kayit olaylarina tepki veren otomatik isler:

```fsl
triggers {
  after_create {
    send_email({ to: this.email, template: "welcome" });
  }

  before_update {
    if (this.status == "blocked") {
      throw Error("Blocked customers cannot be updated");
    }
  }

  after_delete {
    send_email({ to: "admin@company.com", template: "record_deleted" });
  }
}
```

### 10.1 Desteklenen Olaylar

| Olay | Aciklama |
|---|---|
| `after_create` | Kayit olusturulduktan sonra |
| `before_create` | Kayit olusturulmadan once |
| `after_update` | Kayit guncellendikten sonra |
| `before_update` | Kayit guncellenmeden once |
| `after_delete` | Kayit silindikten sonra |
| `before_delete` | Kayit silinmeden once |

---

## 11. Form Tanimlama

Form, entity verileri icin kullanici arayuzu olusturur:

```fsl
form CustomerForm {
  entity: Customer
  layout: "two_column"

  sections {
    basic {
      label: "Temel Bilgiler"
      fields: ["code", "name", "email", "phone"]
    }

    financial {
      label: "Finansal"
      fields: ["credit_limit"]
      permissions: ["finance_manager"]
    }
  }

  actions {
    save { label: "Kaydet", style: "primary" }
    cancel { label: "Iptal" }
  }
}
```

### 11.1 Form Ozellikleri

| Ozellik | Tip | Aciklama |
|---|---|---|
| `entity` | Identifier | Bagli entity adi |
| `layout` | String | `"single"` veya `"two_column"` |
| `sections` | Block | Form bolümleri |
| `actions` | Block | Form butonlari |

### 11.2 Section Ozellikleri

| Ozellik | Tip | Aciklama |
|---|---|---|
| `label` | String | Bolum basligi |
| `fields` | String[] | Gosterilecek field listesi |
| `permissions` | String[] | Bolumu gorebilen roller |

---

## 12. Report Tanimlama

```fsl
report SalesReport {
  title: "Satis Raporu"

  parameters {
    date_range: DateRange { default: "this_month" }
    customer: Lookup(Customer) { optional: true }
  }

  columns {
    name { label: "Musteri" }
    total { label: "Toplam", format: "currency" }
  }

  visualizations {
    chart1 {
      type: "bar_chart"
      x_axis: "name"
      y_axis: "total"
    }
  }
}
```

---

## 13. Workflow Tanimlama

```fsl
workflow InvoiceApproval {
  trigger: on_create(Invoice)

  steps {
    decision {
      condition: invoice.total > 10000

      if_true {
        approval {
          assignee: "finance_director"
          timeout: "2 days"
        }
      }

      if_false {
        auto_approve {
          send_email({
            to: invoice.customer.email,
            template: "invoice_approved"
          });
        }
      }
    }
  }
}
```

---

## 14. Kontrol Akisi (Control Flow)

FSL, method ve trigger govdelerinde kontrol akisi destekler:

### 14.1 Degisken Tanimlama

```fsl
let total = 0;
const tax_rate = 0.18;
```

### 14.2 Kosul (If/Else)

```fsl
if (this.total > 10000) {
  send_email({ to: "manager@company.com", template: "high_order" });
} else {
  auto_approve();
}
```

### 14.3 Dongu (For/While)

```fsl
for (item in this.items) {
  update(item, { status: "processed" });
}

while (retry_count < 3) {
  // yeniden dene
}
```

### 14.4 Return

```fsl
return query("SELECT SUM(total) FROM sales");
```

---

## 15. Operatorler

### 15.1 Karsilastirma

| Operator | Anlam | Ornek |
|---|---|---|
| `==` | Esit | `a == b` |
| `!=` | Esit degil | `a != b` |
| `<` | Kucuk | `a < b` |
| `>` | Buyuk | `a > b` |
| `<=` | Kucuk veya esit | `a <= b` |
| `>=` | Buyuk veya esit | `a >= b` |

### 15.2 Aritmetik

| Operator | Anlam |
|---|---|
| `+` | Toplama |
| `-` | Cikarma |
| `*` | Carpma |
| `/` | Bolme |
| `%` | Mod |

### 15.3 Mantiksal

| Operator | Anlam | Ornek |
|---|---|---|
| `and` | VE | `a > 0 and b > 0` |
| `or` | VEYA | `a > 0 or b > 0` |
| `not` | DEGIL | `not is_deleted` |

---

## 16. Literal'ler

| Tip | Ornek |
|---|---|
| String | `"hello world"` |
| Number | `42`, `3.14` |
| Boolean | `true`, `false` |
| Array | `["a", "b", "c"]` |
| Object | `{ key: "value", count: 5 }` |

---

## 17. Isimlendirme Kurallari

| Oge | Kural | Ornek |
|---|---|---|
| Entity | PascalCase | `Customer`, `SaleOrder` |
| Field | snake_case | `first_name`, `order_date` |
| Method | snake_case | `get_total_sales()` |
| Form | PascalCase + "Form" | `CustomerForm` |
| Report | PascalCase + "Report" | `SalesReport` |
| Workflow | PascalCase + amac | `InvoiceApproval` |
| Constant | UPPER_SNAKE | `MAX_LIMIT` |

---

## 18. Keyword Tam Listesi

### Tanimlama Keywords

```
module  entity  form  report  workflow  dashboard
```

### Blok Keywords

```
fields  methods  permissions  validation  triggers
sections  actions  parameters  columns  visualizations  steps
```

### Veri Tipi Keywords

```
String  Number  Decimal  Boolean
Date  DateTime  DateRange
Email  Phone  URL  Text  JSON
Enum  Relation  File  Image
Array  Money  Computed  Lookup
```

### Constraint Keywords

```
required  unique  indexed  default
min  max  pattern  optional  many
```

### Kontrol Akisi Keywords

```
if  else  for  while  return  let  const
```

### Mantiksal Operator Keywords

```
and  or  not
```

### Tetikleyici Keywords

```
after_create  after_update  after_delete
before_create  before_update  before_delete
on_create
```

### Ozel Degerler

```
true  false  this
```

---

## 19. Gramer (BNF Benzeri)

```
program        → declaration*
declaration    → moduleDecl | entityDecl | formDecl | reportDecl | workflowDecl

moduleDecl     → 'module' STRING '{' (property | declaration)* '}'
entityDecl     → 'entity' IDENTIFIER '{' entityBlock* '}'
entityBlock    → fieldsBlock | methodsBlock | permissionsBlock | triggersBlock | validationBlock

fieldsBlock    → 'fields' '{' fieldDecl* '}'
fieldDecl      → IDENTIFIER ':' dataType constraintBlock?
dataType       ��� TYPE_NAME ('(' params ')')?
params         → (NUMBER | STRING | IDENTIFIER) (',' (NUMBER | STRING | IDENTIFIER))*
constraintBlock→ '{' constraint (',' constraint)* '}'
constraint     → CONSTRAINT_NAME (':' value)?

methodsBlock   → 'methods' '{' methodDecl* '}'
methodDecl     → IDENTIFIER '(' paramList? ')' '{' statement* '}'

permissionsBlock → 'permissions' '{' permissionRule* '}'
permissionRule   → IDENTIFIER ':' arrayLiteral

triggersBlock  → 'triggers' '{' triggerDecl* '}'
triggerDecl    → TRIGGER_EVENT '{' statement* '}'

formDecl       → 'form' IDENTIFIER '{' formBlock* '}'
formBlock      → formProperty | formSections | formActions

reportDecl     → 'report' IDENTIFIER '{' reportBlock* '}'
workflowDecl   → 'workflow' IDENTIFIER '{' workflowBlock* '}'

statement      → returnStmt | varDecl | ifStmt | forStmt | whileStmt | exprStmt
expression     → logicalOr
logicalOr      → logicalAnd ('or' logicalAnd)*
logicalAnd     → comparison ('and' comparison)*
comparison     → additive (compOp additive)?
additive       → multiplicative (('+' | '-') multiplicative)*
multiplicative → unary (('*' | '/' | '%') unary)*
unary          → ('not' | '!' | '-') unary | postfix
postfix        → primary ('.' IDENTIFIER | '(' argList? ')')*
primary        → STRING | NUMBER | 'true' | 'false' | 'this' | IDENTIFIER
               | '(' expression ')' | arrayLiteral | objectLiteral
```

---

## 20. Otomatik Uretilen Alanlar

Her entity icin veritabaninda su alanlar otomatik eklenir:

| Alan | Tip | Aciklama |
|---|---|---|
| `id` | `UUID PRIMARY KEY` | Otomatik benzersiz kimlik |
| `created_at` | `TIMESTAMP DEFAULT NOW()` | Olusturma zamani |
| `created_by` | `UUID` | Olusturan kullanici |
| `updated_at` | `TIMESTAMP` | Son guncelleme zamani |
| `updated_by` | `UUID` | Guncelleyen kullanici |
| `tenant_id` | `UUID NOT NULL` | Multi-tenant izolasyonu |

Bu alanlar FSL'de belirtilmez, platform tarafindan otomatik eklenir.
