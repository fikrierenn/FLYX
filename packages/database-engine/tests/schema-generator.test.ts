import { describe, test, expect } from 'vitest';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { TableGenerator, toSnakeCase, mapFSLTypeToSQL } from '../src/index.js';

const compiler = new FSLCompiler();
const generator = new TableGenerator();

function compileEntity(fsl: string): EntityDeclaration {
  const result = compiler.compile(fsl);
  return result.ast[0] as EntityDeclaration;
}

describe('toSnakeCase', () => {
  test('converts PascalCase', () => {
    expect(toSnakeCase('Customer')).toBe('customer');
    expect(toSnakeCase('SaleOrder')).toBe('sale_order');
    expect(toSnakeCase('OrderItem')).toBe('order_item');
  });
});

describe('mapFSLTypeToSQL', () => {
  test('maps primitive types', () => {
    expect(mapFSLTypeToSQL({ name: 'String', params: [200] })).toBe('VARCHAR(200)');
    expect(mapFSLTypeToSQL({ name: 'String' })).toBe('VARCHAR(255)');
    expect(mapFSLTypeToSQL({ name: 'Number' })).toBe('INTEGER');
    expect(mapFSLTypeToSQL({ name: 'Decimal', params: [12, 2] })).toBe('DECIMAL(12,2)');
    expect(mapFSLTypeToSQL({ name: 'Boolean' })).toBe('BOOLEAN');
    expect(mapFSLTypeToSQL({ name: 'Date' })).toBe('DATE');
    expect(mapFSLTypeToSQL({ name: 'DateTime' })).toBe('TIMESTAMP');
    expect(mapFSLTypeToSQL({ name: 'Email' })).toBe('VARCHAR(255)');
    expect(mapFSLTypeToSQL({ name: 'Text' })).toBe('TEXT');
    expect(mapFSLTypeToSQL({ name: 'JSON' })).toBe('JSONB');
  });

  test('maps Relation to UUID', () => {
    expect(mapFSLTypeToSQL({ name: 'Relation', params: ['Customer'] })).toBe('UUID');
  });
});

describe('TableGenerator', () => {
  test('generates CREATE TABLE for simple entity', () => {
    const entity = compileEntity(`
      entity Customer {
        fields {
          name: String(200) { required }
          email: Email { unique }
        }
      }
    `);

    const schema = generator.generateSchema(entity);

    expect(schema.tableName).toBe('customer');
    expect(schema.createTableSQL).toContain('CREATE TABLE IF NOT EXISTS customer');
    expect(schema.createTableSQL).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
    expect(schema.createTableSQL).toContain('name VARCHAR(200) NOT NULL');
    expect(schema.createTableSQL).toContain('email VARCHAR(255) UNIQUE');
    expect(schema.createTableSQL).toContain('tenant_id UUID NOT NULL');
    expect(schema.createTableSQL).toContain('created_at TIMESTAMP DEFAULT NOW()');
  });

  test('generates indexes for indexed fields', () => {
    const entity = compileEntity(`
      entity Product {
        fields {
          code: String(50) { required, unique, indexed }
          name: String(200) { required }
        }
      }
    `);

    const schema = generator.generateSchema(entity);
    expect(schema.indexes).toHaveLength(1);
    expect(schema.indexes[0]).toContain('CREATE INDEX');
    expect(schema.indexes[0]).toContain('idx_product_code');
  });

  test('generates foreign keys for Relations', () => {
    const entity = compileEntity(`
      entity Order {
        fields {
          customer: Relation(Customer) { required }
        }
      }
    `);

    const schema = generator.generateSchema(entity);
    expect(schema.foreignKeys).toHaveLength(1);
    expect(schema.foreignKeys[0]).toContain('FOREIGN KEY (customer) REFERENCES customer(id)');
  });

  test('generates default values', () => {
    const entity = compileEntity(`
      entity Config {
        fields {
          status: String { default: "active" }
          count: Number { default: 0 }
          enabled: Boolean { default: true }
        }
      }
    `);

    const schema = generator.generateSchema(entity);
    expect(schema.createTableSQL).toContain("DEFAULT 'active'");
    expect(schema.createTableSQL).toContain('DEFAULT 0');
    expect(schema.createTableSQL).toContain('DEFAULT TRUE');
  });

  test('generateFullSQL includes table + indexes + foreign keys', () => {
    const entity = compileEntity(`
      entity Order {
        fields {
          code: String(50) { required, unique, indexed }
          customer: Relation(Customer) { required }
          total: Decimal(12,2)
        }
      }
    `);

    const fullSQL = generator.generateFullSQL(entity);
    expect(fullSQL).toContain('CREATE TABLE IF NOT EXISTS order');
    expect(fullSQL).toContain('CREATE INDEX');
    expect(fullSQL).toContain('FOREIGN KEY');
  });
});
