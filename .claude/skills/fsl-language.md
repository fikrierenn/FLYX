---
name: fsl-language
description: FSL (FLYX Script Language) syntax, veri tipleri ve kaliplari
---

# FSL Language Skill

## Entity Sablonu

```fsl
entity EntityName {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    email: Email { unique }
    phone: Phone
    amount: Decimal(12,2) { default: 0 }
    status: Enum {
      values: ["active", "inactive", "blocked"],
      default: "active"
    }
    category: Relation(Category) { required }
  }

  methods {
    get_total() {
      return query("SELECT SUM(total) FROM orders WHERE customer_id = {this.id}");
    }
  }

  permissions {
    create: ["admin", "manager"]
    read: ["admin", "manager", "user"]
    update: ["admin", "manager"]
    delete: ["admin"]
  }

  triggers {
    after_create {
      send_email({ to: this.email, template: "welcome" });
    }
  }
}
```

## Veri Tipleri

| FSL | PostgreSQL | TypeScript | HTML Input |
|---|---|---|---|
| String(n) | VARCHAR(n) | string | text |
| Number | INTEGER | number | number |
| Decimal(p,s) | DECIMAL(p,s) | number | number |
| Boolean | BOOLEAN | boolean | checkbox |
| Date | DATE | string | date |
| DateTime | TIMESTAMP | string | datetime-local |
| Email | VARCHAR(255) | string | email |
| Phone | VARCHAR(255) | string | tel |
| URL | VARCHAR(255) | string | url |
| Text | TEXT | string | textarea |
| JSON | JSONB | Record<string,any> | - |
| Enum | VARCHAR(100) | string | select |
| Relation(X) | UUID + FK | string | select |
| Money | DECIMAL(15,2) | number | number |
| File | VARCHAR(500) | string | file |
| Computed | - (runtime) | any | - |

## Constraint'ler

| Constraint | SQL | Validator | Ornek |
|---|---|---|---|
| required | NOT NULL | @IsNotEmpty() | `name: String { required }` |
| unique | UNIQUE | - | `email: Email { unique }` |
| indexed | CREATE INDEX | - | `code: String { indexed }` |
| default | DEFAULT val | initializer | `status: String { default: "active" }` |
| min | - | @Min(n) | `age: Number { min: 0 }` |
| max | - | @Max(n) | `age: Number { max: 150 }` |
| pattern | - | @Matches() | `code: String { pattern: "[A-Z]+" }` |
| values | - | @IsIn([]) | `status: Enum { values: ["a","b"] }` |

## Form Sablonu

```fsl
form EntityNameForm {
  entity: EntityName
  layout: "two_column"

  sections {
    main {
      label: "Genel Bilgiler"
      fields: ["code", "name", "email"]
    }
    details {
      label: "Detaylar"
      fields: ["phone", "amount", "status"]
      permissions: ["manager"]
    }
  }

  actions {
    save { label: "Kaydet", style: "primary" }
    cancel { label: "Iptal" }
  }
}
```

## Report Sablonu

```fsl
report ReportName {
  title: "Rapor Basligi"

  parameters {
    date_range: DateRange { default: "this_month" }
    status: Enum { values: ["all", "active"], optional: true }
  }

  columns {
    name { label: "Isim" }
    total { label: "Toplam", format: "currency" }
  }

  visualizations {
    chart1 { type: "bar_chart", x_axis: "name", y_axis: "total" }
  }
}
```

## Workflow Sablonu

```fsl
workflow WorkflowName {
  trigger: on_create(EntityName)

  steps {
    check {
      condition: this.total > 10000

      if_true {
        approval {
          assignee: "manager"
          timeout: "2 days"
        }
      }

      if_false {
        auto_approve {
          send_email({ to: this.customer.email, template: "approved" });
        }
      }
    }
  }
}
```

## Otomatik Uretilen SQL Sutunlari

Her entity tablosuna otomatik eklenir:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `created_at TIMESTAMP DEFAULT NOW()`
- `created_by UUID`
- `updated_at TIMESTAMP`
- `updated_by UUID`
- `tenant_id UUID NOT NULL` (multi-tenant zorunlu)
