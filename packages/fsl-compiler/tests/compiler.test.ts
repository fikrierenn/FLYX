import { describe, test, expect } from 'vitest';
import { FSLCompiler, FSLLexicalError, FSLSyntaxError } from '../src/index.js';
import type { EntityDeclaration, FormDeclaration } from '../src/index.js';

const compiler = new FSLCompiler();

// ============================================================
// 1. Simple Entity Parsing
// ============================================================

describe('Simple entity parsing', () => {
  test('parses entity with two fields', () => {
    const fsl = `
      entity Customer {
        fields {
          name: String(200) { required }
          email: Email { unique }
        }
      }
    `;

    const result = compiler.compile(fsl);
    expect(result.ast).toHaveLength(1);

    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.type).toBe('EntityDeclaration');
    expect(entity.name).toBe('Customer');
    expect(entity.fields).toHaveLength(2);

    // First field
    expect(entity.fields[0].name).toBe('name');
    expect(entity.fields[0].dataType.name).toBe('String');
    expect(entity.fields[0].dataType.params).toEqual([200]);
    expect(entity.fields[0].constraints?.required).toBe(true);

    // Second field
    expect(entity.fields[1].name).toBe('email');
    expect(entity.fields[1].dataType.name).toBe('Email');
    expect(entity.fields[1].constraints?.unique).toBe(true);
  });

  test('parses entity with no fields', () => {
    const fsl = `
      entity Empty {
        fields {
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.name).toBe('Empty');
    expect(entity.fields).toHaveLength(0);
  });
});

// ============================================================
// 2. Multiple Data Types
// ============================================================

describe('Multiple data types', () => {
  test('parses all primitive data types', () => {
    const fsl = `
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
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.fields).toHaveLength(12);

    expect(entity.fields[0].dataType.name).toBe('String');
    expect(entity.fields[0].dataType.params).toEqual([100]);
    expect(entity.fields[1].dataType.name).toBe('Number');
    expect(entity.fields[2].dataType.name).toBe('Decimal');
    expect(entity.fields[2].dataType.params).toEqual([12, 2]);
    expect(entity.fields[3].dataType.name).toBe('Boolean');
    expect(entity.fields[4].dataType.name).toBe('Date');
    expect(entity.fields[5].dataType.name).toBe('DateTime');
    expect(entity.fields[6].dataType.name).toBe('Email');
    expect(entity.fields[7].dataType.name).toBe('Phone');
    expect(entity.fields[8].dataType.name).toBe('URL');
    expect(entity.fields[9].dataType.name).toBe('Text');
    expect(entity.fields[10].dataType.name).toBe('JSON');
    expect(entity.fields[11].dataType.name).toBe('Money');
  });

  test('parses Enum type with values', () => {
    const fsl = `
      entity Product {
        fields {
          status: Enum {
            values: ["active", "inactive", "blocked"],
            default: "active"
          }
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    const field = entity.fields[0];
    expect(field.dataType.name).toBe('Enum');
    expect(field.constraints?.values).toEqual(['active', 'inactive', 'blocked']);
    expect(field.constraints?.default).toBe('active');
  });
});

// ============================================================
// 3. Constraints
// ============================================================

describe('Constraints', () => {
  test('parses all constraint types', () => {
    const fsl = `
      entity Constrained {
        fields {
          code: String(50) { required, unique, indexed }
          age: Number { min: 0, max: 150 }
          status: String { default: "active" }
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;

    // code field
    expect(entity.fields[0].constraints?.required).toBe(true);
    expect(entity.fields[0].constraints?.unique).toBe(true);
    expect(entity.fields[0].constraints?.indexed).toBe(true);

    // age field
    expect(entity.fields[1].constraints?.min).toBe(0);
    expect(entity.fields[1].constraints?.max).toBe(150);

    // status field
    expect(entity.fields[2].constraints?.default).toBe('active');
  });

  test('parses boolean default', () => {
    const fsl = `
      entity Flags {
        fields {
          is_active: Boolean { default: true }
          is_deleted: Boolean { default: false }
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.fields[0].constraints?.default).toBe(true);
    expect(entity.fields[1].constraints?.default).toBe(false);
  });
});

// ============================================================
// 4. Relations
// ============================================================

describe('Relations', () => {
  test('parses Relation type', () => {
    const fsl = `
      entity Order {
        fields {
          customer: Relation(Customer) { required }
          items: Relation(OrderItem) { many: true }
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;

    expect(entity.fields[0].dataType.name).toBe('Relation');
    expect(entity.fields[0].dataType.params).toEqual(['Customer']);
    expect(entity.fields[0].constraints?.required).toBe(true);

    expect(entity.fields[1].dataType.name).toBe('Relation');
    expect(entity.fields[1].dataType.params).toEqual(['OrderItem']);
    expect(entity.fields[1].constraints?.many).toBe(true);
  });
});

// ============================================================
// 5. Permissions
// ============================================================

describe('Permissions', () => {
  test('parses permission block', () => {
    const fsl = `
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
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.permissions).toBeDefined();
    expect(entity.permissions?.create).toEqual(['admin']);
    expect(entity.permissions?.read).toEqual(['admin', 'manager']);
    expect(entity.permissions?.update).toEqual(['admin']);
    expect(entity.permissions?.delete).toEqual(['admin']);
  });
});

// ============================================================
// 6. Methods & Triggers
// ============================================================

describe('Methods and triggers', () => {
  test('parses methods block', () => {
    const fsl = `
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
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.methods).toHaveLength(1);
    expect(entity.methods![0].name).toBe('get_total');
    expect(entity.methods![0].body).toHaveLength(1);
    expect(entity.methods![0].body[0].type).toBe('ReturnStatement');
  });

  test('parses triggers block', () => {
    const fsl = `
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
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.triggers).toBeDefined();
    expect(entity.triggers!.triggers).toHaveLength(1);
    expect(entity.triggers!.triggers[0].event).toBe('after_create');
  });
});

// ============================================================
// 7. Form Declaration
// ============================================================

describe('Form declaration', () => {
  test('parses form with sections and actions', () => {
    const fsl = `
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
    `;

    const result = compiler.compile(fsl);
    const form = result.ast[0] as FormDeclaration;
    expect(form.type).toBe('FormDeclaration');
    expect(form.name).toBe('CustomerForm');
    expect(form.entity).toBe('Customer');
    expect(form.layout).toBe('two_column');
    expect(form.sections).toHaveLength(1);
    expect(form.sections[0].label).toBe('Basic Info');
    expect(form.sections[0].fields).toEqual(['name', 'email']);
    expect(form.actions).toHaveLength(1);
    expect(form.actions![0].label).toBe('Save');
    expect(form.actions![0].style).toBe('primary');
  });
});

// ============================================================
// 8. Multiple Declarations
// ============================================================

describe('Multiple declarations', () => {
  test('parses multiple entities in one source', () => {
    const fsl = `
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
    `;

    const result = compiler.compile(fsl);
    expect(result.ast).toHaveLength(2);
    expect((result.ast[0] as EntityDeclaration).name).toBe('Customer');
    expect((result.ast[1] as EntityDeclaration).name).toBe('Product');
  });
});

// ============================================================
// 9. Comments
// ============================================================

describe('Comments', () => {
  test('ignores single-line comments', () => {
    const fsl = `
      // This is a comment
      entity Test {
        fields {
          // Field comment
          name: String { required }
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    expect(entity.name).toBe('Test');
    expect(entity.fields).toHaveLength(1);
  });

  test('ignores multi-line comments', () => {
    const fsl = `
      /* Multi-line
         comment */
      entity Test {
        fields {
          name: String
        }
      }
    `;

    const result = compiler.compile(fsl);
    expect(result.ast).toHaveLength(1);
  });
});

// ============================================================
// 10. Error Cases
// ============================================================

describe('Error cases', () => {
  test('throws FSLLexicalError for invalid characters', () => {
    const fsl = `entity Test { fields { name: String§ } }`;

    expect(() => compiler.compile(fsl)).toThrow(FSLLexicalError);
  });

  test('throws FSLSyntaxError for missing closing brace', () => {
    const fsl = `
      entity Test {
        fields {
          name: String
    `;

    expect(() => compiler.compile(fsl)).toThrow(FSLSyntaxError);
  });

  test('throws FSLSyntaxError for invalid syntax', () => {
    const fsl = `entity { }`;

    expect(() => compiler.compile(fsl)).toThrow(FSLSyntaxError);
  });
});
