import { describe, test, expect } from 'vitest';

// ═══════════════════════════════════════
// Naming Engine Testleri
// ═══════════════════════════════════════

import {
  toPlural, toSingular,
  toPascalCase, toCamelCase, toKebabCase, toSnakeCase,
  toControllerName, toServiceName, toStoreName, toLabel, toApiPath,
} from '../src/core/naming/index.js';

describe('Naming Engine - Pluralization', () => {
  test('basit cogullastirma', () => {
    expect(toPlural('customer')).toBe('customers');
    expect(toPlural('product')).toBe('products');
    expect(toPlural('order')).toBe('orders');
  });

  test('y ile biten kelimeler (sessiz harf + y)', () => {
    expect(toPlural('category')).toBe('categories');
    expect(toPlural('company')).toBe('companies');
    expect(toPlural('city')).toBe('cities');
  });

  test('y ile biten kelimeler (sesli harf + y)', () => {
    expect(toPlural('day')).toBe('days');
    expect(toPlural('key')).toBe('keys');
    expect(toPlural('boy')).toBe('boys');
  });

  test('s/x/z/ch/sh ile biten kelimeler', () => {
    expect(toPlural('box')).toBe('boxes');
    expect(toPlural('church')).toBe('churches');
    expect(toPlural('bus')).toBe('buses');
    expect(toPlural('wish')).toBe('wishes');
  });

  test('duzensiz cogullar', () => {
    expect(toPlural('person')).toBe('people');
    expect(toPlural('child')).toBe('children');
    expect(toPlural('analysis')).toBe('analyses');
  });

  test('sayilamayan isimler', () => {
    expect(toPlural('equipment')).toBe('equipment');
    expect(toPlural('software')).toBe('software');
    expect(toPlural('data')).toBe('data');
  });
});

describe('Naming Engine - Singularization', () => {
  test('basit tekillestime', () => {
    expect(toSingular('customers')).toBe('customer');
    expect(toSingular('products')).toBe('product');
  });

  test('ies → y', () => {
    expect(toSingular('categories')).toBe('category');
    expect(toSingular('companies')).toBe('company');
  });

  test('duzensiz tekillestime', () => {
    expect(toSingular('people')).toBe('person');
    expect(toSingular('children')).toBe('child');
  });
});

describe('Naming Engine - Case Conversion', () => {
  test('toPascalCase', () => {
    expect(toPascalCase('customer')).toBe('Customer');
    expect(toPascalCase('sale_order')).toBe('SaleOrder');
    expect(toPascalCase('order-item')).toBe('OrderItem');
    expect(toPascalCase('SaleOrder')).toBe('SaleOrder');
  });

  test('toCamelCase', () => {
    expect(toCamelCase('Customer')).toBe('customer');
    expect(toCamelCase('SaleOrder')).toBe('saleOrder');
    expect(toCamelCase('sale_order')).toBe('saleOrder');
  });

  test('toKebabCase', () => {
    expect(toKebabCase('SaleOrder')).toBe('sale-order');
    expect(toKebabCase('Customer')).toBe('customer');
  });

  test('toSnakeCase', () => {
    expect(toSnakeCase('SaleOrder')).toBe('sale_order');
    expect(toSnakeCase('Customer')).toBe('customer');
  });
});

describe('Naming Engine - Entity Names', () => {
  test('NestJS isimleri', () => {
    expect(toControllerName('Customer')).toBe('CustomersController');
    expect(toServiceName('Customer')).toBe('CustomersService');
  });

  test('React isimleri', () => {
    expect(toStoreName('Customer')).toBe('useCustomerStore');
  });

  test('label', () => {
    expect(toLabel('credit_limit')).toBe('Credit Limit');
    expect(toLabel('firstName')).toBe('First Name');
  });

  test('API path', () => {
    expect(toApiPath('Customer')).toBe('/api/customers');
    expect(toApiPath('SaleOrder')).toBe('/api/sale-orders');
  });
});

// ═══════════════════════════════════════
// Type Mapper Testleri
// ═══════════════════════════════════════

import {
  mapToTSType, mapToInputType, mapToValidatorDecorators,
  collectValidatorImports,
} from '../src/core/type-mapper/index.js';

describe('Type Mapper - TS Types', () => {
  test('temel tipler', () => {
    expect(mapToTSType({ name: 'String' })).toBe('string');
    expect(mapToTSType({ name: 'Number' })).toBe('number');
    expect(mapToTSType({ name: 'Boolean' })).toBe('boolean');
    expect(mapToTSType({ name: 'Email' })).toBe('string');
    expect(mapToTSType({ name: 'Decimal' })).toBe('number');
    expect(mapToTSType({ name: 'JSON' })).toBe('Record<string, any>');
    expect(mapToTSType({ name: 'Relation' })).toBe('string');
  });

  test('bilinmeyen tip → any', () => {
    expect(mapToTSType({ name: 'Unknown' })).toBe('any');
  });
});

describe('Type Mapper - Input Types', () => {
  test('HTML input tipleri', () => {
    expect(mapToInputType({ name: 'String' })).toBe('text');
    expect(mapToInputType({ name: 'Email' })).toBe('email');
    expect(mapToInputType({ name: 'Phone' })).toBe('tel');
    expect(mapToInputType({ name: 'Number' })).toBe('number');
    expect(mapToInputType({ name: 'Boolean' })).toBe('checkbox');
    expect(mapToInputType({ name: 'Date' })).toBe('date');
    expect(mapToInputType({ name: 'Enum' })).toBe('select');
    expect(mapToInputType({ name: 'Text' })).toBe('textarea');
  });
});

describe('Type Mapper - Validators', () => {
  test('zorunlu string field', () => {
    const decorators = mapToValidatorDecorators({
      type: 'FieldDeclaration', name: 'name',
      dataType: { name: 'String', params: [200] },
      constraints: { required: true },
    });

    const names = decorators.map((d) => d.name);
    expect(names).toContain('IsString');
    expect(names).toContain('IsNotEmpty');
    expect(names).toContain('MaxLength');
    expect(names).not.toContain('IsOptional');
  });

  test('opsiyonel email field', () => {
    const decorators = mapToValidatorDecorators({
      type: 'FieldDeclaration', name: 'email',
      dataType: { name: 'Email' },
    });

    const names = decorators.map((d) => d.name);
    expect(names).toContain('IsEmail');
    expect(names).toContain('IsOptional');
    expect(names).not.toContain('IsNotEmpty');
  });

  test('min/max constraint', () => {
    const decorators = mapToValidatorDecorators({
      type: 'FieldDeclaration', name: 'age',
      dataType: { name: 'Number' },
      constraints: { min: 0, max: 150 },
    });

    const names = decorators.map((d) => d.name);
    expect(names).toContain('Min');
    expect(names).toContain('Max');
  });

  test('enum values', () => {
    const decorators = mapToValidatorDecorators({
      type: 'FieldDeclaration', name: 'status',
      dataType: { name: 'Enum' },
      constraints: { values: ['active', 'inactive'] },
    });

    const names = decorators.map((d) => d.name);
    expect(names).toContain('IsIn');
  });

  test('import toplama', () => {
    const fields = [
      { type: 'FieldDeclaration' as const, name: 'name', dataType: { name: 'String', params: [200] }, constraints: { required: true } },
      { type: 'FieldDeclaration' as const, name: 'email', dataType: { name: 'Email' } },
      { type: 'FieldDeclaration' as const, name: 'age', dataType: { name: 'Number' }, constraints: { min: 0 } },
    ];

    const imports = collectValidatorImports(fields);
    expect(imports).toContain('IsString');
    expect(imports).toContain('IsEmail');
    expect(imports).toContain('IsNumber');
    expect(imports).toContain('Min');
    // Tekrar eden import olmamali
    expect(new Set(imports).size).toBe(imports.length);
  });
});

// ═══════════════════════════════════════
// Generator Engine Testleri
// ═══════════════════════════════════════

import { GeneratorEngine } from '../src/core/generator-engine.js';
import type { GeneratedFile, GeneratorPlugin } from '../src/core/types.js';

describe('Generator Engine', () => {
  test('bos engine dosya uretmez', () => {
    const engine = new GeneratorEngine();
    const files = engine.generate({
      type: 'EntityDeclaration', name: 'Test', fields: [],
    });
    expect(files).toHaveLength(0);
  });

  test('kayitli generator dosya uretir', () => {
    const engine = new GeneratorEngine();
    engine.registerGenerator('nestjs', 'backend', {
      generate: (entity) => [{
        path: `${entity.name.toLowerCase()}.controller.ts`,
        content: `// ${entity.name} controller`,
        category: 'controller',
      }],
    });

    const files = engine.generate({
      type: 'EntityDeclaration', name: 'Customer', fields: [],
    });

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('customer.controller.ts');
  });

  test('skip backend → backend generator calismaz', () => {
    const engine = new GeneratorEngine();
    engine.registerGenerator('nestjs', 'backend', {
      generate: () => [{ path: 'ctrl.ts', content: '', category: 'controller' }],
    });
    engine.registerGenerator('react', 'frontend', {
      generate: () => [{ path: 'page.tsx', content: '', category: 'page' }],
    });

    const files = engine.generate(
      { type: 'EntityDeclaration', name: 'Test', fields: [] },
      { skip: ['backend'] },
    );

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('page.tsx');
  });

  test('plugin beforeGenerate hook calisiyor', () => {
    const engine = new GeneratorEngine();
    const log: string[] = [];

    const plugin: GeneratorPlugin = {
      name: 'test-plugin',
      beforeGenerate: (entity) => {
        log.push(`before:${entity.name}`);
      },
    };

    engine.registerPlugin(plugin);
    engine.generate({ type: 'EntityDeclaration', name: 'Customer', fields: [] });

    expect(log).toEqual(['before:Customer']);
  });

  test('plugin afterGenerate hook dosya ekleyebilir', () => {
    const engine = new GeneratorEngine();

    const plugin: GeneratorPlugin = {
      name: 'readme-plugin',
      afterGenerate: (ctx) => {
        return [
          ...ctx.files,
          { path: 'README.md', content: `# ${ctx.entity.name}`, category: 'other' },
        ];
      },
    };

    engine.registerPlugin(plugin);
    engine.registerGenerator('nestjs', 'backend', {
      generate: () => [{ path: 'ctrl.ts', content: '', category: 'controller' }],
    });

    const files = engine.generate({
      type: 'EntityDeclaration', name: 'Customer', fields: [],
    });

    expect(files).toHaveLength(2);
    expect(files[1].path).toBe('README.md');
    expect(files[1].content).toBe('# Customer');
  });
});

// ═══════════════════════════════════════
// Emitter Testleri
// ═══════════════════════════════════════

import { CodeEmitter, dedent } from '../src/core/emitter/index.js';

describe('Code Emitter', () => {
  test('basit satir uretimi', () => {
    const e = new CodeEmitter();
    e.line('const x = 1;');
    e.line('const y = 2;');
    expect(e.toString()).toBe('const x = 1;\nconst y = 2;');
  });

  test('girintileme', () => {
    const e = new CodeEmitter();
    e.block('class Foo', () => {
      e.line('bar = 1;');
    });
    expect(e.toString()).toContain('  bar = 1;');
  });

  test('bos satir', () => {
    const e = new CodeEmitter();
    e.line('a');
    e.line();
    e.line('b');
    expect(e.toString()).toBe('a\n\nb');
  });
});

describe('dedent', () => {
  test('ortak boslugu kaldirir', () => {
    const result = dedent(`
      hello
      world
    `);
    expect(result).toBe('hello\nworld');
  });
});
