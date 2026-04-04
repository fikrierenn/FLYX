---
name: code-generator
description: FLYX code-generator paketine yeni generator ekleme ve mevcut generator'lari duzenleme rehberi
---

# FLYX Code Generator Skill

## Mimari

```
packages/code-generator/src/
  core/                     # Paylasilan altyapi
    naming/index.ts         # toPlural, toCamelCase, toSnakeCase, toLabel, toApiPath
    type-mapper/index.ts    # mapToTSType, mapToInputType, mapToValidatorDecorators
    validation/index.ts     # generateDTOField, generateValidatorImports
    emitter/index.ts        # CodeEmitter (indent/dedent/block)
    generator-engine.ts     # GeneratorEngine (Strategy + Plugin)
    types.ts                # Generator, GeneratorPlugin, GeneratedFile interfaces
  generators/
    nestjs/                 # String-based NestJS generator'lar
    nestjs-ast/             # ts-morph AST-based NestJS generator'lar
    react/                  # String-based React generator'lar
```

## Yeni Generator Ekleme

```typescript
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toPlural, toCamelCase, toSnakeCase } from '../../core/naming/index.js';
import { mapToTSType, mapToInputType } from '../../core/type-mapper/index.js';

export class MyNewGenerator {
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);
    // ... kod uret
    return generatedCode;
  }
}
```

## ONEMLI KURALLAR

1. **ASLA `utils/string-helpers` import etme** → `core/naming/index.js` kullan
2. **ASLA duplicate type mapping yazma** → `core/type-mapper/index.js` kullan
3. **core/ modullerini kullan:**
   - Isimlendirme: `core/naming` (toPlural, toCamelCase, toLabel, toApiPath)
   - Tip esleme: `core/type-mapper` (mapToTSType, mapToInputType, getDefaultValue)
   - Validasyon: `core/validation` (generateDTOField, generateValidatorImports)
4. **AST-based generator icin** ts-morph kullan (`generators/nestjs-ast/` ornegine bak)
5. **Test yaz** her generator icin (tests/ altinda)

## GeneratorEngine Kullanimi

```typescript
import { GeneratorEngine } from './core/generator-engine.js';

const engine = new GeneratorEngine();

// Generator kaydet
engine.registerGenerator('nestjs', 'backend', myBackendGenerator);
engine.registerGenerator('react', 'frontend', myFrontendGenerator);

// Plugin kaydet
engine.registerPlugin({
  name: 'audit-plugin',
  beforeGenerate: (entity, options) => { /* ... */ },
  afterGenerate: (ctx) => { return ctx.files; },
});

// Uret
const files = engine.generate(entity, {
  backend: 'nestjs',
  frontend: 'react',
  skip: [], // veya ['backend'] sadece frontend uret
});
```

## Test Yazma

```typescript
import { FSLCompiler } from '@flyx/fsl-compiler';
import { MyGenerator } from '../src/generators/my-generator.js';

const compiler = new FSLCompiler();
const generator = new MyGenerator();

function compileEntity(fsl: string) {
  return compiler.compile(fsl).ast[0] as EntityDeclaration;
}

test('basit entity', () => {
  const entity = compileEntity(`entity Test { fields { name: String { required } } }`);
  const code = generator.generate(entity);
  expect(code).toContain('TestsController');
});
```
