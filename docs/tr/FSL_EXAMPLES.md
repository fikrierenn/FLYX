# FSL Ornekleri

Compiler testlerinden ve projeden alinmis calisan FSL kod ornekleri.

---

## 1. Basit Entity

En temel entity tanimlama - iki alanli bir musteri:

```fsl
entity Customer {
  fields {
    name: String(200) { required }
    email: Email { unique }
  }
}
```

**Uretilen SQL:**

```sql
CREATE TABLE IF NOT EXISTS customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP,
  updated_by UUID,
  tenant_id UUID NOT NULL
);
```

**Uretilen AST:**

```json
{
  "type": "EntityDeclaration",
  "name": "Customer",
  "fields": [
    {
      "type": "FieldDeclaration",
      "name": "name",
      "dataType": { "name": "String", "params": [200] },
      "constraints": { "required": true }
    },
    {
      "type": "FieldDeclaration",
      "name": "email",
      "dataType": { "name": "Email" },
      "constraints": { "unique": true }
    }
  ]
}
```

---

## 2. Tum Veri Tipleri

Her FSL veri tipini gosteren entity:

```fsl
entity AllTypes {
  fields {
    f_string: String(100) { required }
    f_number: Number
    f_decimal: Decimal(12,2)
    f_boolean: Boolean
    f_date: Date
    f_datetime: DateTime
    f_email: Email
    f_phone: Phone
    f_url: URL
    f_text: Text
    f_json: JSON
    f_money: Money
  }
}
```

**PostgreSQL karsiliklari:**

| FSL | SQL |
|---|---|
| `String(100)` | `VARCHAR(100)` |
| `Number` | `INTEGER` |
| `Decimal(12,2)` | `DECIMAL(12,2)` |
| `Boolean` | `BOOLEAN` |
| `Date` | `DATE` |
| `DateTime` | `TIMESTAMP` |
| `Email` | `VARCHAR(255)` |
| `Phone` | `VARCHAR(255)` |
| `URL` | `VARCHAR(255)` |
| `Text` | `TEXT` |
| `JSON` | `JSONB` |
| `Money` | `DECIMAL(15,2)` |

---

## 3. Enum Tipi

Sabit deger listesi:

```fsl
entity Product {
  fields {
    status: Enum {
      values: ["active", "inactive", "blocked"],
      default: "active"
    }
  }
}
```

---

## 4. Constraint Ornekleri

Farkli constraint kombinasyonlari:

```fsl
entity Constrained {
  fields {
    code: String(50) { required, unique, indexed }
    age: Number { min: 0, max: 150 }
    status: String { default: "active" }
    is_active: Boolean { default: true }
    is_deleted: Boolean { default: false }
  }
}
```

---

## 5. Iliski (Relation) Ornekleri

```fsl
entity Order {
  fields {
    // Bire-cok: Bir siparis bir musteriye aittir
    customer: Relation(Customer) { required }

    // Coka-cok: Bir siparisin birden fazla kalemi olabilir
    items: Relation(OrderItem) { many: true }
  }
}
```

**Uretilen SQL:**

```sql
CREATE TABLE IF NOT EXISTS order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer UUID NOT NULL,
  items UUID,
  ...
);

ALTER TABLE order ADD CONSTRAINT fk_order_customer
  FOREIGN KEY (customer) REFERENCES customer(id);
```

---

## 6. Yetki (Permission) Ornegi

CRUD bazli rol erisimi:

```fsl
entity Secret {
  fields {
    data: Text
  }
  permissions {
    create: ["admin"]
    read: ["admin", "manager"]
    update: ["admin"]
    delete: ["admin"]
  }
}
```

---

## 7. Metod Ornegi

Entity uzerinde is mantigi:

```fsl
entity Customer {
  fields {
    name: String(200) { required }
  }
  methods {
    get_total() {
      return query("SELECT SUM(total) FROM sales");
    }
  }
}
```

---

## 8. Trigger Ornegi

Kayit olaylarina otomatik tepki:

```fsl
entity Customer {
  fields {
    email: Email
  }
  triggers {
    after_create {
      send_email("welcome");
    }
  }
}
```

---

## 9. Form Ornegi

Tam ozellikli form tanimlama:

```fsl
form CustomerForm {
  entity: Customer
  layout: "two_column"

  sections {
    basic {
      label: "Basic Info"
      fields: ["name", "email"]
    }
  }

  actions {
    save {
      label: "Save"
      style: "primary"
    }
  }
}
```

---

## 10. Birden Fazla Entity

Tek dosyada birden fazla entity:

```fsl
entity Customer {
  fields {
    name: String(200) { required }
  }
}

entity Product {
  fields {
    title: String(300) { required }
    price: Decimal(10,2)
  }
}
```

---

## 11. Yorumlar

```fsl
// Bu bir musteri entity'sidir
entity Test {
  fields {
    // Alan yorumu
    name: String { required }
  }
}

/* Cok satirlik
   yorum blogu */
entity Test2 {
  fields {
    name: String
  }
}
```

---

## 12. Tam ERP Ornegi - Satis Modulu

```fsl
// Musteri tanimlama
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
    category: Relation(Category)
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

// Musteri formu
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

// Urun tanimlama
entity Product {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    price: Decimal(10,2) { required, min: 0 }
    stock: Number { default: 0, min: 0 }
    category: Relation(Category)
  }
}

// Siparis tanimlama
entity Order {
  fields {
    order_no: String(20) { required, unique, indexed }
    customer: Relation(Customer) { required }
    order_date: Date { required }
    total: Decimal(12,2) { default: 0 }
    status: Enum {
      values: ["draft", "confirmed", "shipped", "delivered", "cancelled"],
      default: "draft"
    }
  }

  methods {
    calculate_total() {
      return query("SELECT SUM(quantity * unit_price) FROM order_items WHERE order_id = {this.id}");
    }
  }
}
```

---

## 13. Hata Durumlari

FSL compiler su hatalari yakalar:

**Lexical Error** - Gecersiz karakter:
```fsl
entity Test { fields { name: String§ } }
// Hata: Unexpected character "§"
```

**Syntax Error** - Eksik kapanma:
```fsl
entity Test {
  fields {
    name: String
// Hata: Expecting token of type --> RCurly
```

**Syntax Error** - Yanlis yapi:
```fsl
entity { }
// Hata: Expecting token of type --> Identifier
```
