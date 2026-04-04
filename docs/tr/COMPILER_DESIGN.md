# FSL Compiler - Tasarim Dokumantasyonu

---

## 1. Genel Mimari

FSL Compiler, 3 asamali bir derleme pipeline'i kullanir:

```
FSL Kaynak Kodu (string)
        │
        ▼
   ┌─────────┐
   │  LEXER   │  Chevrotain Lexer
   │          │  Kaynak kodu → Token dizisi
   └────┬─────┘
        │  ILexingResult { tokens, errors }
        ▼
   ┌─────────┐
   │  PARSER  │  Chevrotain CstParser
   │          │  Token dizisi → CST (Concrete Syntax Tree)
   └────┬─────┘
        │  CstNode
        ▼
   ┌─────────┐
   │ VISITOR  │  CSTToASTVisitor
   │          │  CST → AST (Abstract Syntax Tree)
   └────┬─────┘
        │  Declaration[]
        ▼
   CompileResult { ast, source }
```

---

## 2. Lexer (Sozcuksel Cozumleme)

### 2.1 Gorev

Kaynak kodu karakter karakter okuyarak anlamli parcalara (token) ayirir.

**Dosya:** `packages/fsl-compiler/src/lexer/tokens.ts`

### 2.2 Token Kategorileri

| Kategori | Ornek Token'lar | Sayi |
|---|---|---|
| Whitespace/Comment | WhiteSpace, SingleLineComment, MultiLineComment | 3 (atlanir) |
| Declaration Keywords | Module, Entity, Form, Report, Workflow, Dashboard | 6 |
| Block Keywords | Fields, Methods, Permissions, Triggers, vb. | 11 |
| Control Flow | If, Else, For, While, Return, Let, Const | 7 |
| Logical Operators | And, Or, Not | 3 |
| Trigger Keywords | AfterCreate, BeforeUpdate, OnCreate, vb. | 7 |
| Data Types | StringType, NumberType, EmailType, vb. | 20 |
| Constraints | Required, Unique, Indexed, Default, vb. | 9 |
| Built-in Values | True, False, This | 3 |
| Symbols | LCurly, RCurly, Colon, Comma, vb. | 10 |
| Operators | Equal, NotEqual, Plus, Minus, vb. | 15 |
| Literals | StringLiteral, NumberLiteral | 2 |
| Identifier | Identifier | 1 |
| **Toplam** | | **~97** |

### 2.3 Token Sirasi (Oncelik)

`allTokens` dizisindeki sira kritiktir:

```typescript
export const allTokens = [
  // 1. Whitespace ve Comment (oncelikli - atlanir)
  WhiteSpace, SingleLineComment, MultiLineComment,

  // 2. Literal'ler (NumberLiteral keyword'lerden once)
  StringLiteral, NumberLiteral,

  // 3. Uzun keyword'ler once (after_create > after)
  AfterCreate, AfterUpdate, AfterDelete, ...

  // 4. Data type'lar (DateTime > Date, PascalCase)
  DateTimeType, DateRangeType, DateType, StringType, ...

  // 5. Declaration keyword'ler
  Module, Entity, Form, ...

  // 6. Block keyword'ler
  Fields, Methods, Permissions, ...

  // 7. Control flow
  If, Else, For, While, ...

  // 8. Constraint'ler
  Required, Unique, Indexed, ...

  // 9. Boolean literal'ler
  True, False, This,

  // 10. Cok-karakterli operatorler (!=, <=, >= ONCE)
  NotEqual, LessEqual, GreaterEqual, Equal,

  // 11. Semboller
  LCurly, RCurly, LParen, ...

  // 12. Tek-karakterli operatorler
  Assign, Plus, Minus, ...

  // 13. Identifier (EN SON - her seyi yakalar)
  Identifier,
];
```

### 2.4 longer_alt Mekanizmasi

Tum keyword token'lari `longer_alt: Identifier` ile tanimlanir. Bu, `moduleName` gibi bir identifier'in `module` + `Name` olarak yanlis ayristirilmasini onler:

```typescript
export const Module = createToken({
  name: 'Module',
  pattern: /module/,
  longer_alt: Identifier  // "moduleName" → Identifier, "module" → Module
});
```

### 2.5 FSLLexer Sinifi

```typescript
export class FSLLexer {
  private lexer: Lexer;

  constructor() {
    this.lexer = new Lexer(allTokens, {
      ensureOptimizations: true,  // Performans optimizasyonu
    });
  }

  tokenize(input: string): ILexingResult {
    return this.lexer.tokenize(input);
  }
}
```

**Ornek cikti:**

```
Girdi: "entity Customer { fields { name: String } }"

Token'lar:
  Entity      "entity"
  Identifier  "Customer"
  LCurly      "{"
  Fields      "fields"
  LCurly      "{"
  Identifier  "name"
  Colon       ":"
  StringType  "String"
  RCurly      "}"
  RCurly      "}"
```

---

## 3. Parser (Sozdizimsel Cozumleme)

### 3.1 Gorev

Token dizisini gramer kuralarina gore CST'ye (Concrete Syntax Tree) donusturur.

**Dosya:** `packages/fsl-compiler/src/parser/parser.ts`

### 3.2 Gramer Kurallari (58 adet)

Parser, Chevrotain'in `CstParser` sinifini extend eder ve `RULE()` ile gramer kurallarini tanimlar:

```typescript
export class FSLParser extends CstParser {
  constructor() {
    super(allTokens, {
      recoveryEnabled: true,   // Hatadan kurtulma
      maxLookahead: 3,         // Ileriye bakma mesafesi
    });
    this.performSelfAnalysis(); // Gramer dogrulama
  }
```

### 3.3 Kural Hiyerarsisi

```
program
├── declaration
│   ├── moduleDeclaration
│   │   ├── moduleProperty
│   │   └── declaration (recursive)
│   ├── entityDeclaration
│   │   └── entityBlock
│   │       ├── fieldsBlock
│   │       │   └── fieldDeclaration
│   │       │       ├── dataType
│   │       │       │   ├── dataTypeName
│   │       │       │   └── dataTypeParams
│   │       │       └── constraintBlock
│   │       │           └── constraint
│   │       ├── methodsBlock
│   │       │   └── methodDeclaration
│   │       │       └── statement*
│   │       ├── permissionsBlock
│   │       │   └── permissionRule
│   │       ├── triggersBlock
│   │       │   └── triggerDeclaration
│   │       └── validationBlock
│   ├── formDeclaration
│   │   └── formBlock
│   │       ├── formProperty (propertyName ile keyword destegi)
│   │       ├── formSections → formSection
│   │       └── formActions → formAction
│   ├── reportDeclaration
│   │   └── reportBlock
│   └── workflowDeclaration
│       └── workflowBlock
│           ├── workflowTrigger
│           └── workflowSteps → workflowStep → workflowEntry
│
├── statement
│   ├── returnStatement
│   ├── variableDeclaration
│   ├── ifStatement
│   ├── forStatement
│   ├── whileStatement
│   └── expressionStatement
│
└── expression (oncelik sirasi ile)
    └── logicalOrExpression
        └── logicalAndExpression
            └── comparisonExpression
                └── additiveExpression
                    └── multiplicativeExpression
                        └── unaryExpression
                            └── postfixExpression (. ve () zincirleme)
                                └── primaryExpression
```

### 3.4 Operator Onceligi (Dusukten Yuuksege)

| Seviye | Operatorler | Yonelim |
|---|---|---|
| 1 (en dusuk) | `or` | Soldan saga |
| 2 | `and` | Soldan saga |
| 3 | `==` `!=` `<` `>` `<=` `>=` | Soldan saga |
| 4 | `+` `-` | Soldan saga |
| 5 | `*` `/` `%` | Soldan saga |
| 6 | `not` `!` `-` (unary) | Sagdan sola |
| 7 (en yuksek) | `.` `()` (postfix) | Soldan saga |

### 3.5 propertyName Kurali

Form ve rapor icindeki ozellik adlari keyword olabilir (`entity:`, `fields:` gibi). `propertyName` kurali hem keyword'leri hem identifier'lari kabul eder:

```typescript
private propertyName = this.RULE('propertyName', () => {
  this.OR([
    { ALT: () => this.CONSUME(Entity) },
    { ALT: () => this.CONSUME(Fields) },
    { ALT: () => this.CONSUME(Permissions) },
    // ... diger keyword'ler
    { ALT: () => this.CONSUME(Identifier) },
  ]);
});
```

---

## 4. CST → AST Donusumu (Visitor)

### 4.1 Gorev

Chevrotain'in urettigi CST'yi (Concrete Syntax Tree), kullanilabilir AST'ye (Abstract Syntax Tree) donusturur.

**Dosya:** `packages/fsl-compiler/src/parser/cst-visitor.ts`

### 4.2 Calisma Prensibi

```typescript
const parserInstance = new FSLParser();
const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructor();

export class CSTToASTVisitor extends BaseCstVisitor {
  constructor() {
    super();
    this.validateVisitor(); // Tum kurallar icin visitor metodu var mi kontrol
  }

  // Her parser kurali icin bir visitor metodu
  entityDeclaration(ctx: any): EntityDeclaration {
    const name = ctx.Identifier[0].image;
    // ... CST'den deger cikart, AST node olustur
  }
}
```

### 4.3 CST vs AST Farki

**CST (Chevrotain ciktisi):** Parse agacinin tam temsili, tum token'lar dahil.

**AST (Visitor ciktisi):** Sadece anlamli bilgileri iceren temiz agac.

```
CST:
  entityDeclaration
    Entity: "entity"        ← gereksiz (tip bilgisi yeterli)
    Identifier: "Customer"
    LCurly: "{"             ← gereksiz
    entityBlock
      fieldsBlock
        Fields: "fields"    ← gereksiz
        LCurly: "{"         ← gereksiz
        fieldDeclaration
          Identifier: "name"
          Colon: ":"        ← gereksiz
          dataType
            StringType: "String"
        RCurly: "}"         ← gereksiz
    RCurly: "}"             ← gereksiz

AST:
  {
    type: "EntityDeclaration",
    name: "Customer",
    fields: [{
      type: "FieldDeclaration",
      name: "name",
      dataType: { name: "String" }
    }]
  }
```

### 4.4 Array Literal Donusumu

Visitor, array icindeki basit literal'leri otomatik olarak duz degerlere donusturur:

```typescript
arrayLiteral(ctx: any): any[] {
  return ctx.expression.map((e: CstNode) => {
    const val = this.visit(e);
    if (val.type === 'StringLiteral') return val.value;   // "admin" → "admin"
    if (val.type === 'NumberLiteral') return val.value;   // 42 → 42
    if (val.type === 'BooleanLiteral') return val.value;  // true → true
    return val;  // Karmasik ifadeler AST node olarak kalir
  });
}
```

Bu sayede `permissions: { create: ["admin", "manager"] }` ifadesi `["admin", "manager"]` string dizisine donusur.

---

## 5. AST Node Tipleri

### 5.1 Tip Hiyerarsisi

```
ASTNode (base)
├── ModuleDeclaration
├── EntityDeclaration
│   ├── FieldDeclaration → DataType, FieldConstraints
│   ├── MethodDeclaration → Statement[]
│   ├── PermissionBlock
│   ├── TriggerBlock → TriggerDeclaration
│   └── ValidationBlock → ValidationRule
├── FormDeclaration → FormSection, FormAction
├── ReportDeclaration → ReportParameter, ReportColumn, ReportVisualization
├── WorkflowDeclaration → WorkflowTrigger, WorkflowStep
│   ├── DecisionStep
│   ├── ApprovalStep
│   └── ActionStep
└── DashboardDeclaration → DashboardWidget
```

### 5.2 Temel AST Node

```typescript
interface ASTNode {
  type: string;             // Node tipi (discriminator)
  location?: SourceLocation; // Kaynak koddaki konum
}

interface SourceLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

### 5.3 Expression Tipleri

```typescript
type Expression =
  | StringLiteralExpr   // { type: "StringLiteral", value: "hello" }
  | NumberLiteralExpr   // { type: "NumberLiteral", value: 42 }
  | BooleanLiteralExpr  // { type: "BooleanLiteral", value: true }
  | IdentifierExpr      // { type: "Identifier", name: "customer" }
  | MemberExpr          // { type: "MemberExpression", object: ..., property: "name" }
  | CallExpr            // { type: "CallExpression", callee: ..., arguments: [...] }
  | BinaryExpr          // { type: "BinaryExpression", operator: "+", left: ..., right: ... }
  | UnaryExpr           // { type: "UnaryExpression", operator: "not", operand: ... }
  | ArrayExpr           // { type: "ArrayExpression", elements: [...] }
  | ObjectExpr          // { type: "ObjectExpression", properties: [...] }
```

---

## 6. Hata Yonetimi

### 6.1 Hata Siniflari

```typescript
FSLCompileError (base)
├── FSLLexicalError   // Gecersiz karakter
└── FSLSyntaxError    // Gramer hatasi
```

### 6.2 Kullanim

```typescript
try {
  const result = compiler.compile(source);
} catch (error) {
  if (error instanceof FSLLexicalError) {
    // error.errors → ILexingError[] (satir, sutun, mesaj)
  }
  if (error instanceof FSLSyntaxError) {
    // error.errors → IRecognitionException[] (beklenen token, bulunan token)
  }
}
```

---

## 7. Code Generation (SQL Uretimi)

### 7.1 Type Mapping

```typescript
// packages/database-engine/src/schema-generator/type-mapper.ts

function mapFSLTypeToSQL(dataType: DataType): string {
  switch (dataType.name) {
    case 'String':   return `VARCHAR(${dataType.params?.[0] ?? 255})`;
    case 'Number':   return 'INTEGER';
    case 'Decimal':  return `DECIMAL(${p},${s})`;
    case 'Boolean':  return 'BOOLEAN';
    case 'Date':     return 'DATE';
    case 'DateTime': return 'TIMESTAMP';
    case 'Email':    return 'VARCHAR(255)';
    case 'Text':     return 'TEXT';
    case 'JSON':     return 'JSONB';
    case 'Relation': return 'UUID';
    // ...
  }
}
```

### 7.2 Tam Uretim Akisi

```
EntityDeclaration
    │
    ├─→ TableGenerator.generateSchema()
    │     │
    │     ├─→ "CREATE TABLE IF NOT EXISTS customer ("
    │     ├─→ "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"
    │     ├─→ "  name VARCHAR(200) NOT NULL,"      ← field + constraint
    │     ├─→ "  email VARCHAR(255) UNIQUE,"
    │     ├─→ "  created_at TIMESTAMP DEFAULT NOW(),"  ← otomatik
    │     ├─→ "  tenant_id UUID NOT NULL"              ← otomatik
    │     └─→ ");"
    │
    ├─→ Index uretimi
    │     └─→ "CREATE INDEX idx_customer_code ON customer(code);"
    │
    └─→ Foreign Key uretimi
          └─→ "ALTER TABLE order ADD CONSTRAINT fk_order_customer
                FOREIGN KEY (customer) REFERENCES customer(id);"
```
