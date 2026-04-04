# 🚀 FLYX Platform - Claude Code Komutları

Claude Code'a vereceğin komutlar - sırayla!

---

## 📋 BAŞLANGIÇ (İlk Setup)

### Komut 1: Proje Oluştur
```bash
claude-code "Create a monorepo project structure using Turborepo with:

Project name: flyx-platform
Workspaces:
  - packages/fsl-compiler
  - packages/database-engine
  - packages/runtime-engine
  - packages/platform-core
  - apps/api
  - apps/web

Setup:
- Root package.json with Turborepo
- TypeScript 5.0 throughout
- Shared tsconfig.base.json
- Prettier + ESLint configs
- Git initialized with .gitignore

Generate turbo.json with build/dev/test pipelines"
```

---

## 🔨 PACKAGE 1: FSL COMPILER (Hafta 1-2)

### Komut 2: FSL Compiler Package Setup
```bash
cd packages/fsl-compiler

claude-code "Create TypeScript package for FSL (FLYX Script Language) compiler:

Purpose: Parse FSL code into Abstract Syntax Tree (AST)

FSL is a domain-specific language for business applications.
Example FSL code:
entity Customer {
  fields {
    name: String(200) { required }
    email: Email { unique }
  }
}

Setup package with:
- package.json with dependencies: chevrotain@^11.0.0, zod@^3.22.0
- src/ directory
- tests/ directory
- tsconfig.json extending workspace config
- vitest for testing

Folder structure:
src/
  lexer/       # Tokenizer
  parser/      # Parser
  ast/         # AST node types
  analyzer/    # Semantic analysis
  generator/   # Code generator
  compiler.ts  # Main class
  index.ts     # Public API
"
```

### Komut 3: FSL Tokens (Lexer Part 1)
```bash
claude-code "Create src/lexer/tokens.ts using Chevrotain's createToken:

Define FSL tokens:

KEYWORDS:
- module, entity, form, report, workflow
- fields, methods, permissions, triggers, validation
- if, else, for, while, return
- let, const

DATA TYPES:
- String, Number, Decimal, Boolean
- Date, DateTime, Email, Phone, URL, Text, JSON
- Enum, Relation, File, Image

CONSTRAINTS:
- required, unique, indexed, default, min, max

SYMBOLS:
- { } ( ) [ ] : , . = + - * / < > ! & |

LITERALS:
- Identifier: /[a-zA-Z_][a-zA-Z0-9_]*/
- StringLiteral: /\"[^\"]*\"/
- NumberLiteral: /\d+(\.\d+)?/
- BooleanLiteral: true, false

Export allTokens array with proper ordering (keywords before identifiers)
"
```

### Komut 4: FSL Lexer Class
```bash
claude-code "Create src/lexer/lexer.ts with FSLLexer class:

Import { Lexer } from 'chevrotain'
Import tokens from './tokens'

Class FSLLexer extends Lexer:
- Constructor takes allTokens
- Add helper method: tokenize(input: string) that returns ILexingResult
- Handle whitespace (skip)
- Handle comments: // single-line and /* multi-line */

Export default FSLLexer
"
```

### Komut 5: AST Node Types
```bash
claude-code "Create src/ast/nodes.ts with TypeScript interfaces for AST nodes:

Base interface:
interface ASTNode {
  type: string;
  location?: SourceLocation;
}

Entity nodes:
interface EntityDeclaration extends ASTNode {
  type: 'EntityDeclaration';
  name: string;
  fields: FieldDeclaration[];
  methods?: MethodDeclaration[];
  permissions?: PermissionBlock;
  triggers?: TriggerBlock;
}

interface FieldDeclaration extends ASTNode {
  type: 'FieldDeclaration';
  name: string;
  dataType: DataType;
  constraints?: FieldConstraints;
}

interface DataType {
  name: string; // String, Number, etc.
  params?: (string | number)[]; // e.g., String(200)
}

interface FieldConstraints {
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: any;
  min?: number;
  max?: number;
}

Also define: MethodDeclaration, PermissionBlock, TriggerBlock, FormDeclaration, ReportDeclaration
"
```

### Komut 6: FSL Parser (Grammar)
```bash
claude-code "Create src/parser/parser.ts using Chevrotain CstParser:

FSL Grammar:

module → 'module' StringLiteral '{' (entity | form | report | workflow)* '}'

entity → 'entity' Identifier '{' 
           (fields | methods | permissions | triggers)* 
         '}'

fields → 'fields' '{' fieldDeclaration* '}'

fieldDeclaration → Identifier ':' dataType constraintBlock?

dataType → DataTypeName ('(' params ')')?

constraintBlock → '{' constraint (',' constraint)* '}'

constraint → Identifier (':' value)?

Implement with Chevrotain:
- Use RULE() for each grammar rule
- Use CONSUME() for terminals
- Use SUBRULE() for non-terminals
- Use OPTION() for optional
- Use MANY() for repetition

Generate CST (Concrete Syntax Tree) - we'll convert to AST later
"
```

### Komut 7: CST to AST Converter
```bash
claude-code "Create src/parser/cst-visitor.ts:

Class CSTToASTVisitor that converts Chevrotain CST to our AST nodes

For each grammar rule, implement visitor method:
- entityDeclaration(ctx) → EntityDeclaration
- fieldDeclaration(ctx) → FieldDeclaration
- etc.

Extract values from CST context:
- ctx.Identifier[0].image for identifiers
- ctx.StringLiteral[0].image for strings
- Handle arrays with .map()

Return properly typed AST nodes
"
```

### Komut 8: Main Compiler Class
```bash
claude-code "Create src/compiler.ts with FSLCompiler class:

import FSLLexer from './lexer/lexer'
import FSLParser from './parser/parser'
import CSTToASTVisitor from './parser/cst-visitor'

class FSLCompiler {
  private lexer = new FSLLexer()
  private parser = new FSLParser()
  private visitor = new CSTToASTVisitor()
  
  compile(source: string): CompileResult {
    // 1. Lexical analysis
    const lexResult = this.lexer.tokenize(source)
    if (lexResult.errors.length > 0) {
      throw new LexicalError(lexResult.errors)
    }
    
    // 2. Parsing
    this.parser.input = lexResult.tokens
    const cst = this.parser.module()
    if (this.parser.errors.length > 0) {
      throw new SyntaxError(this.parser.errors)
    }
    
    // 3. AST generation
    const ast = this.visitor.visit(cst)
    
    return { ast, source }
  }
}

interface CompileResult {
  ast: ASTNode
  source: string
}
"
```

### Komut 9: Tests
```bash
claude-code "Create tests/compiler.test.ts using vitest:

import { describe, test, expect } from 'vitest'
import { FSLCompiler } from '../src/compiler'

Test cases:

1. Simple entity parsing:
const fsl = \`
  entity Customer {
    fields {
      name: String(200) { required }
      email: Email { unique }
    }
  }
\`
expect(ast.type).toBe('EntityDeclaration')
expect(ast.fields).toHaveLength(2)

2. Multiple data types:
Test String, Number, Decimal, Boolean, Date, Email

3. Constraints:
Test required, unique, indexed, default, min, max

4. Relations:
customer: Relation(Customer)

5. Error cases:
- Missing closing brace
- Invalid token
- Unknown data type

Run: npm test
"
```

---

## 🗄️ PACKAGE 2: DATABASE ENGINE (Hafta 3-4)

### Komut 10: Database Engine Setup
```bash
cd packages/database-engine

claude-code "Create database engine package:

Purpose: Convert FSL AST to SQL schemas and generate CRUD operations

Dependencies:
- prisma@^5.0.0
- kysely@^0.27.0
- pg@^8.11.0

Structure:
src/
  schema-generator/   # AST → CREATE TABLE SQL
  migration/          # Schema migrations
  query-builder/      # Type-safe queries
  crud-generator/     # Auto CRUD APIs
  index.ts

Main features:
1. Schema Generator: EntityDeclaration → CREATE TABLE
2. Type Mapper: FSL types → PostgreSQL types
3. Migration Manager: Apply schema changes
4. CRUD Generator: Generate TypeScript CRUD functions
"
```

### Komut 11: Schema Generator
```bash
claude-code "Create src/schema-generator/table-generator.ts:

Class TableGenerator {
  generateCreateTable(entity: EntityDeclaration): string {
    // Start with CREATE TABLE
    let sql = \`CREATE TABLE \${toSnakeCase(entity.name)} (\n\`
    
    // Add id (auto-generated)
    sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n'
    
    // Add fields
    for (const field of entity.fields) {
      sql += '  ' + this.generateColumn(field) + ',\n'
    }
    
    // Add audit columns
    sql += '  created_at TIMESTAMP DEFAULT NOW(),\n'
    sql += '  created_by UUID REFERENCES users(id),\n'
    sql += '  updated_at TIMESTAMP,\n'
    sql += '  updated_by UUID,\n'
    sql += '  tenant_id UUID NOT NULL\n'
    sql += ');'
    
    return sql
  }
  
  private generateColumn(field: FieldDeclaration): string {
    const colName = toSnakeCase(field.name)
    const colType = this.mapType(field.dataType)
    
    let col = \`\${colName} \${colType}\`
    
    if (field.constraints?.required) col += ' NOT NULL'
    if (field.constraints?.unique) col += ' UNIQUE'
    if (field.constraints?.default) {
      col += \` DEFAULT \${formatDefault(field.constraints.default)}\`
    }
    
    return col
  }
  
  private mapType(dataType: DataType): string {
    switch (dataType.name) {
      case 'String':
        const length = dataType.params?.[0] || 255
        return \`VARCHAR(\${length})\`
      case 'Number': return 'INTEGER'
      case 'Decimal':
        const precision = dataType.params?.[0] || 10
        const scale = dataType.params?.[1] || 2
        return \`DECIMAL(\${precision},\${scale})\`
      case 'Boolean': return 'BOOLEAN'
      case 'Date': return 'DATE'
      case 'DateTime': return 'TIMESTAMP'
      case 'Email':
      case 'Phone':
      case 'URL': return 'VARCHAR(255)'
      case 'Text': return 'TEXT'
      case 'JSON': return 'JSONB'
      default: throw new Error(\`Unknown type: \${dataType.name}\`)
    }
  }
}
"
```

---

## 🌐 APP: API (Hafta 9)

### Komut 12: NestJS API Setup
```bash
cd apps/api

claude-code "Create NestJS application for FLYX Platform API:

Initialize with:
nest new api --package-manager npm

Structure:
src/
  app.module.ts
  main.ts
  common/
    guards/
      tenant.guard.ts       # Multi-tenant guard
      jwt-auth.guard.ts     # JWT authentication
    middleware/
      tenant.middleware.ts  # Resolve tenant from subdomain
    interceptors/
      logging.interceptor.ts
  modules/
    tenant/               # Tenant management
    auth/                 # Authentication
    fsl/                  # FSL compilation endpoint
    entities/             # Dynamic CRUD for entities
    forms/                # Form rendering
    reports/              # Report execution

Features needed:
1. Multi-tenant middleware (subdomain → tenant_id)
2. JWT authentication
3. RBAC (Role-Based Access Control)
4. Dynamic CRUD endpoints based on FSL entities
5. Swagger documentation
"
```

---

## 🎨 APP: WEB UI (Hafta 5-6)

### Komut 13: React Web App
```bash
cd apps/web

claude-code "Create React application with Vite:

npm create vite@latest web -- --template react-ts

Structure:
src/
  components/
    designers/
      FormDesigner/       # Drag-drop form builder
        FormDesigner.tsx
        FieldToolbox.tsx
        Canvas.tsx
        PropertyPanel.tsx
      ReportDesigner/
      WorkflowDesigner/
    renderers/
      FormRenderer/       # Render forms from FSL
      ReportRenderer/
    editors/
      FSLEditor/          # Monaco editor for FSL code
        FSLEditor.tsx
        fsl-language.ts   # FSL syntax highlighting
  pages/
    Dashboard/
    Entities/
    Forms/
  hooks/
    useCompiler.ts        # Hook to compile FSL
    useTenant.ts          # Current tenant context
  stores/
    authStore.ts          # Zustand store
    moduleStore.ts

Dependencies:
- @tanstack/react-query
- zustand
- tailwindcss
- @radix-ui/react-*
- monaco-editor
- dnd-kit
- lucide-react
"
```

### Komut 14: Form Designer Component
```bash
claude-code "Create src/components/designers/FormDesigner/FormDesigner.tsx:

React component with drag-and-drop form builder using dnd-kit

Features:
1. Left sidebar: Field toolbox
   - Text Input
   - Number Input
   - Email
   - Dropdown
   - Date Picker
   - Checkbox
   - etc.

2. Center: Canvas
   - Drop zone for fields
   - Field preview
   - Reorder fields (drag)

3. Right sidebar: Property panel
   - Selected field properties
   - Label, placeholder, required, etc.

4. Bottom: Code preview
   - Monaco editor showing generated FSL code
   - Real-time update

State:
- fields: Field[]
- selectedField: Field | null
- layout: 'single' | 'two_column'

Generate FSL code from state:
const generateFSL = () => {
  let fsl = \`form \${formName} {\n\`
  fsl += \`  entity: \${entityName}\n\`
  fsl += \`  layout: \"\${layout}\"\n\n\`
  fsl += \`  sections {\n\`
  // ... generate sections
  fsl += \`  }\n\`
  fsl += \`}\`
  return fsl
}
"
```

---

## 📝 SON KONTROL

### Test All Packages
```bash
claude-code "In project root, create test script in package.json:

{
  \"scripts\": {
    \"test:all\": \"turbo run test\",
    \"build:all\": \"turbo run build\",
    \"dev\": \"turbo run dev --parallel\"
  }
}

Then run:
npm run test:all

Verify:
✓ fsl-compiler tests pass
✓ database-engine tests pass
✓ API starts successfully
✓ Web app builds without errors
"
```

---

## 🎯 ÖZET: CLAUDE CODE KULLANIMI

**Her komutta:**
1. ✅ **Context ver:** Ne yapıyorsun, neden
2. ✅ **Örnekler göster:** Kod snippets ekle
3. ✅ **Klasör yapısını belirt:** Tam path
4. ✅ **Dependencies listele:** package.json
5. ✅ **Test iste:** Her özellik için test

**İyi Prompt:**
```bash
claude-code "Create X with:
- Purpose: ...
- Technology: ...
- Structure: ...
- Features: ...
- Test: ..."
```

**Kötü Prompt:**
```bash
claude-code "Make a compiler"  # ❌ Çok genel!
```

---

**BU DOSYAYI KULLAN! Her komutu sırayla çalıştır! 🚀**
