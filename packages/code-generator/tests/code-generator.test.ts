import { describe, test, expect } from 'vitest';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { CodeGenerator } from '../src/index.js';
import { toPlural, toPascalCase, toCamelCase, toKebabCase, toSnakeCase } from '../src/utils/string-helpers.js';

const compiler = new FSLCompiler();
const generator = new CodeGenerator();

function compileEntity(fsl: string): EntityDeclaration {
  return compiler.compile(fsl).ast[0] as EntityDeclaration;
}

// ═══════════════════════════════════════
// String Helpers
// ═══════════════════════════════════════

describe('String Helpers', () => {
  test('toPlural', () => {
    expect(toPlural('customer')).toBe('customers');
    expect(toPlural('box')).toBe('boxes');
    expect(toPlural('category')).toBe('categories');
  });

  test('toPascalCase', () => {
    expect(toPascalCase('customer')).toBe('Customer');
    expect(toPascalCase('sale_order')).toBe('SaleOrder');
  });

  test('toCamelCase', () => {
    expect(toCamelCase('Customer')).toBe('customer');
    expect(toCamelCase('SaleOrder')).toBe('saleOrder');
  });

  test('toKebabCase', () => {
    expect(toKebabCase('Customer')).toBe('customer');
    expect(toKebabCase('SaleOrder')).toBe('sale-order');
  });

  test('toSnakeCase', () => {
    expect(toSnakeCase('Customer')).toBe('customer');
    expect(toSnakeCase('SaleOrder')).toBe('sale_order');
  });
});

// ═══════════════════════════════════════
// Full Code Generation
// ═══════════════════════════════════════

describe('CodeGenerator', () => {
  const entity = compileEntity(`
    entity Customer {
      fields {
        code: String(50) { required, unique }
        name: String(200) { required }
        email: Email { unique }
        phone: Phone
        credit_limit: Decimal(12,2) { default: 0 }
        status: Enum {
          values: ["active", "inactive", "blocked"],
          default: "active"
        }
      }

      permissions {
        create: ["admin", "sales_manager"]
        read: ["admin", "sales_manager", "sales_rep"]
        update: ["admin", "sales_manager"]
        delete: ["admin"]
      }
    }
  `);

  test('generates all files', () => {
    const files = generator.generate(entity);

    expect(files.nestjs.controller).toBeDefined();
    expect(files.nestjs.service).toBeDefined();
    expect(files.nestjs.module).toBeDefined();
    expect(files.nestjs.createDto).toBeDefined();
    expect(files.nestjs.updateDto).toBeDefined();
    expect(files.react.listPage).toBeDefined();
    expect(files.react.formModal).toBeDefined();
    expect(files.react.store).toBeDefined();
  });

  test('controller has correct CRUD endpoints', () => {
    const files = generator.generate(entity);
    const ctrl = files.nestjs.controller;

    expect(ctrl).toContain("@Controller('customers')");
    expect(ctrl).toContain('@Get()');
    expect(ctrl).toContain("@Get(':id')");
    expect(ctrl).toContain('@Post()');
    expect(ctrl).toContain("@Put(':id')");
    expect(ctrl).toContain("@Delete(':id')");
  });

  test('controller has correct role guards', () => {
    const files = generator.generate(entity);
    const ctrl = files.nestjs.controller;

    expect(ctrl).toContain("@Roles('admin', 'sales_manager', 'sales_rep')");
    expect(ctrl).toContain("@Roles('admin', 'sales_manager')");
    expect(ctrl).toContain("@Roles('admin')");
  });

  test('create DTO has validation decorators', () => {
    const files = generator.generate(entity);
    const dto = files.nestjs.createDto;

    expect(dto).toContain('CreateCustomerDto');
    expect(dto).toContain('@IsString()');
    expect(dto).toContain('@MaxLength(50)');
    expect(dto).toContain('@MaxLength(200)');
    expect(dto).toContain('@IsEmail()');
    expect(dto).toContain('@IsOptional()');
  });

  test('update DTO extends PartialType of create DTO', () => {
    const files = generator.generate(entity);
    const dto = files.nestjs.updateDto;

    expect(dto).toContain('UpdateCustomerDto');
    expect(dto).toContain('PartialType(CreateCustomerDto)');
  });

  test('module wires controller and service', () => {
    const files = generator.generate(entity);
    const mod = files.nestjs.module;

    expect(mod).toContain('CustomersController');
    expect(mod).toContain('CustomersService');
    expect(mod).toContain('CustomersModule');
  });

  test('react store has CRUD operations', () => {
    const files = generator.generate(entity);
    const store = files.react.store;

    expect(store).toContain('useCustomerStore');
    expect(store).toContain('fetchCustomers');
    expect(store).toContain('createCustomer');
    expect(store).toContain('updateCustomer');
    expect(store).toContain('deleteCustomer');
    expect(store).toContain("'/api/customers'");
  });

  test('react list page has table with fields', () => {
    const files = generator.generate(entity);
    const page = files.react.listPage;

    expect(page).toContain('CustomersPage');
    expect(page).toContain('useCustomerStore');
    expect(page).toContain('Code');
    expect(page).toContain('Name');
    expect(page).toContain('Email');
  });

  test('react form modal has input fields', () => {
    const files = generator.generate(entity);
    const form = files.react.formModal;

    expect(form).toContain('CustomerFormModal');
    expect(form).toContain('type="email"');
    expect(form).toContain('type="tel"');
    expect(form).toContain('type="number"');
    expect(form).toContain('<select');
  });
});

// ═══════════════════════════════════════
// Edge Cases
// ═══════════════════════════════════════

describe('Edge Cases', () => {
  test('entity with no permissions uses admin default', () => {
    const entity = compileEntity(`
      entity Product {
        fields {
          name: String(200) { required }
        }
      }
    `);

    const files = generator.generate(entity);
    expect(files.nestjs.controller).toContain("@Roles('admin')");
  });

  test('entity with boolean field', () => {
    const entity = compileEntity(`
      entity Feature {
        fields {
          name: String(100) { required }
          enabled: Boolean { default: false }
        }
      }
    `);

    const files = generator.generate(entity);
    expect(files.nestjs.createDto).toContain('@IsBoolean()');
    expect(files.react.formModal).toContain('type="checkbox"');
  });

  test('entity with relation field', () => {
    const entity = compileEntity(`
      entity Order {
        fields {
          order_no: String(20) { required, unique }
          customer: Relation(Customer) { required }
          total: Decimal(12,2)
        }
      }
    `);

    const files = generator.generate(entity);
    expect(files.react.store).toContain('customer: string');
  });
});
