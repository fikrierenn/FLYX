# FSL (FLYX Script Language) - Hızlı Referans

Claude Code için - FSL syntax rehberi

---

## 🎯 FSL NEDİR?

Domain-Specific Language (DSL) for business applications.

**Amaç:** İş uygulamaları tanımlamak için basit dil.

**Kullanım:** Platform bu tanımlardan otomatik SQL + API + UI üretir.

---

## 📝 TEMEL SYNTAX

### Module (Modül)
```fsl
module "FLYX:ERP" {
  version: "1.0.0"
  dependencies: ["FLYX:Platform"]
  
  // Entities, Forms, Reports, Workflows
}
```

### Entity (Varlık)
```fsl
entity Customer {
  fields {
    code: String(50) { required, unique }
    name: String(200) { required }
    email: Email { unique }
    phone: Phone
    credit_limit: Decimal(12,2) { default: 0 }
    status: Enum {
      values: ["active", "inactive", "blocked"]
      default: "active"
    }
    category: Relation(Category)
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

### Form
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
    cancel { label: "İptal" }
  }
}
```

### Report
```fsl
report SalesReport {
  title: "Satış Raporu"
  
  parameters {
    date_range: DateRange { default: "this_month" }
    customer: Lookup(Customer) { optional: true }
  }
  
  data_source: query {
    SELECT c.name, SUM(s.total) as total
    FROM customers c
    JOIN sales s ON s.customer_id = c.id
    WHERE s.sale_date BETWEEN {params.date_range.start} AND {params.date_range.end}
    GROUP BY c.id, c.name
    ORDER BY total DESC
  }
  
  columns {
    name { label: "Müşteri" }
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

### Workflow
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
        auto_approve()
      }
    }
    
    send_email({
      to: invoice.customer.email,
      template: "invoice_approved"
    });
  }
}
```

---

## 📊 VERİ TİPLERİ

### Primitive Types
```fsl
// String
name: String                  // Unlimited
code: String(50)             // Max 50 chars

// Number
age: Number                  // INTEGER
quantity: Number { min: 0 }

// Decimal
price: Decimal               // DECIMAL(10,2)
total: Decimal(12,2)         // DECIMAL(12,2)

// Boolean
is_active: Boolean
has_discount: Boolean { default: false }

// Date/Time
birth_date: Date
created_at: DateTime
order_date: Date { default: TODAY() }

// Specialized
email: Email                 // Email validation
phone: Phone                 // Phone format
url: URL
```

### Complex Types
```fsl
// Enum
status: Enum {
  values: ["new", "active", "blocked"]
  default: "new"
}

// Relation
customer: Relation(Customer)
category: Relation(Category) { required }
tags: Relation(Tag) { many: true }  // Many-to-Many

// File
avatar: File { accept: ["image/*"], maxSize: "5MB" }
photo: Image { maxWidth: 1024, maxHeight: 1024 }

// JSON
metadata: JSON
settings: JSON { default: {} }

// Array
tags: Array(String)
prices: Array(Decimal)
```

---

## ⚙️ CONSTRAINTS

```fsl
name: String(200) {
  required        // NOT NULL
  unique          // UNIQUE constraint
  indexed         // CREATE INDEX
  default: "N/A"  // DEFAULT value
  min: 3          // Min length/value
  max: 200        // Max length/value
}
```

---

## 🔑 KEYWORDS (Tam Liste)

### Declarations
```
module, entity, form, report, workflow, dashboard
```

### Blocks
```
fields, methods, permissions, validation, triggers
sections, actions, parameters, columns, visualizations
steps
```

### Data Types
```
String, Number, Decimal, Boolean
Date, DateTime
Email, Phone, URL, Text, JSON
Enum, Relation, File, Image
Array, Money
```

### Constraints
```
required, unique, indexed, default
min, max, pattern
```

### Control Flow
```
if, else, for, while, return
let, const
```

### Built-in Functions
```
query()          // SQL query
send_email()     // Email gönder
send_sms()       // SMS gönder
create()         // Entity oluştur
update()         // Entity güncelle
delete()         // Entity sil
```

### Operators
```
=, !=, <, >, <=, >=
+, -, *, /, %
and, or, not
```

---

## 🎨 ÖRNEKLER (Daha Fazla)

### Computed Field
```fsl
full_name: Computed {
  expression: "{first_name} {last_name}"
}

age: Computed {
  expression: "YEAR(NOW()) - YEAR(birth_date)"
}
```

### Validation Rules
```fsl
validation {
  on_create {
    if (!this.email.endsWith("@company.com")) {
      throw Error("Only company emails allowed");
    }
  }
  
  rules {
    email_format {
      field: "email"
      pattern: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
      message: "Invalid email"
    }
  }
}
```

### Conditional Display (Form)
```fsl
conditional_display {
  show_if_admin {
    condition: current_user().role == "admin"
    targets: ["sensitive_section"]
  }
  
  disable_if_inactive {
    condition: this.status == "inactive"
    targets: ["credit_limit"]
    action: "disable"
  }
}
```

---

## 🔄 AST STRUCTURE (Compiler Output)

```typescript
// Input FSL:
entity Customer {
  fields {
    name: String(200) { required }
  }
}

// Output AST:
{
  "type": "EntityDeclaration",
  "name": "Customer",
  "fields": [
    {
      "type": "FieldDeclaration",
      "name": "name",
      "dataType": {
        "name": "String",
        "params": [200]
      },
      "constraints": {
        "required": true
      }
    }
  ]
}
```

---

## ✅ GRAMMAR (BNF-like)

```
module        → 'module' STRING '{' declaration* '}'
declaration   → entity | form | report | workflow

entity        → 'entity' IDENTIFIER '{' entityBlock* '}'
entityBlock   → fields | methods | permissions | triggers

fields        → 'fields' '{' fieldDecl* '}'
fieldDecl     → IDENTIFIER ':' dataType constraintBlock?

dataType      → IDENTIFIER ('(' params ')')?
params        → NUMBER (',' NUMBER)*

constraintBlock → '{' constraint (',' constraint)* '}'
constraint      → IDENTIFIER (':' value)?

form          → 'form' IDENTIFIER '{' formBlock* '}'
formBlock     → 'entity:' IDENTIFIER
              | 'layout:' STRING
              | sections
              | actions

// ... devamı
```

---

## 💡 BEST PRACTICES

1. **Naming:**
   - Entities: PascalCase (Customer, SaleOrder)
   - Fields: snake_case (first_name, order_date)
   - Constants: UPPER_SNAKE (MAX_LIMIT)

2. **Constraints:**
   - Always add `required` when needed
   - Use `unique` for codes/emails
   - Add `indexed` for frequently searched fields

3. **Relations:**
   - Specify `on_delete` behavior
   - Use meaningful names

4. **Validation:**
   - Validate at field level when possible
   - Use custom validation for complex rules

5. **Performance:**
   - Add indexes strategically
   - Avoid N+1 queries in methods
   - Use computed fields sparingly

---

**Bu dosyayı Claude Code'a referans olarak göster!**
