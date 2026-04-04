/**
 * Snapshot Testleri
 * ==================
 * Üretilen kodun yapısının beklenmedik şekilde değişmediğini doğrular.
 * Her snapshot, üretilen kodun "fotoğrafını" çeker.
 * Kod değişirse test başarısız olur ve farkı gösterir.
 *
 * Snapshot güncelleme: npx vitest run -u
 */

import { describe, test, expect } from 'vitest';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { CodeGenerator } from '../src/index.js';

const compiler = new FSLCompiler();
const generator = new CodeGenerator();

function compileEntity(fsl: string): EntityDeclaration {
  return compiler.compile(fsl).ast[0] as EntityDeclaration;
}

const customerEntity = compileEntity(`
  entity Customer {
    fields {
      code: String(50) { required, unique, indexed }
      name: String(200) { required }
      email: Email { unique }
      phone: Phone
      status: Enum {
        values: ["active", "inactive"],
        default: "active"
      }
    }
    permissions {
      create: ["admin", "manager"]
      read: ["admin", "manager", "user"]
      update: ["admin", "manager"]
      delete: ["admin"]
    }
  }
`);

describe('Snapshot: NestJS Controller', () => {
  test('Customer controller snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.nestjs.controller).toMatchSnapshot();
  });
});

describe('Snapshot: NestJS Service', () => {
  test('Customer service snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.nestjs.service).toMatchSnapshot();
  });
});

describe('Snapshot: NestJS Module', () => {
  test('Customer module snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.nestjs.module).toMatchSnapshot();
  });
});

describe('Snapshot: Create DTO', () => {
  test('Customer createDto snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.nestjs.createDto).toMatchSnapshot();
  });
});

describe('Snapshot: Update DTO', () => {
  test('Customer updateDto snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.nestjs.updateDto).toMatchSnapshot();
  });
});

describe('Snapshot: React List Page', () => {
  test('Customer list page snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.react.listPage).toMatchSnapshot();
  });
});

describe('Snapshot: React Form Modal', () => {
  test('Customer form modal snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.react.formModal).toMatchSnapshot();
  });
});

describe('Snapshot: React Store', () => {
  test('Customer store snapshot', () => {
    const files = generator.generate(customerEntity);
    expect(files.react.store).toMatchSnapshot();
  });
});
