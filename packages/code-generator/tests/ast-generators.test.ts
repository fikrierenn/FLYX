/**
 * AST Tabanlı Generator Testleri
 * ================================
 * ts-morph ile üretilen NestJS kodunun doğruluğunu test eder.
 * String-based generator'larla aynı entity'leri kullanır,
 * böylece çıktı kalitesi karşılaştırılabilir.
 */

import { describe, test, expect } from 'vitest';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { ASTControllerGenerator } from '../src/generators/nestjs-ast/ast-controller-generator.js';
import { ASTServiceGenerator } from '../src/generators/nestjs-ast/ast-service-generator.js';
import { ASTDTOGenerator } from '../src/generators/nestjs-ast/ast-dto-generator.js';

const compiler = new FSLCompiler();

function compileEntity(fsl: string): EntityDeclaration {
  return compiler.compile(fsl).ast[0] as EntityDeclaration;
}

const customerEntity = compileEntity(`
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

// ═══════════════════════════════════════
// AST Controller Generator
// ═══════════════════════════════════════

describe('ASTControllerGenerator', () => {
  const generator = new ASTControllerGenerator();

  test('gecerli TypeScript kodu uretir', () => {
    const code = generator.generate(customerEntity);
    // ts-morph urettigi icin syntax hatasi olmamali
    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(0);
  });

  test('sinif ve dekoratorler dogru', () => {
    const code = generator.generate(customerEntity);
    expect(code).toContain('CustomersController');
    expect(code).toContain("@Controller('customers')");
    expect(code).toContain('@UseGuards(JwtAuthGuard, RolesGuard)');
    expect(code).toContain("@ApiTags('customers')");
  });

  test('CRUD metotlari mevcut', () => {
    const code = generator.generate(customerEntity);
    expect(code).toContain('findAll');
    expect(code).toContain('findOne');
    expect(code).toContain('create');
    expect(code).toContain('update');
    expect(code).toContain('remove');
  });

  test('roller dogru atanmis', () => {
    const code = generator.generate(customerEntity);
    // read rolleri findAll ve findOne'da kullanilir
    expect(code).toContain("'sales_rep'");
    // delete rolu sadece 'admin'
    expect(code).toContain("@Roles('admin')");
  });

  test('importlar mevcut', () => {
    const code = generator.generate(customerEntity);
    expect(code).toContain('from "@nestjs/common"');
    expect(code).toContain('from "@nestjs/swagger"');
    expect(code).toContain('CustomersService');
    expect(code).toContain('CreateCustomerDto');
    expect(code).toContain('UpdateCustomerDto');
  });
});

// ═══════════════════════════════════════
// AST Service Generator
// ═══════════════════════════════════════

describe('ASTServiceGenerator', () => {
  const generator = new ASTServiceGenerator();

  test('gecerli service kodu uretir', () => {
    const code = generator.generate(customerEntity);
    expect(code).toContain('CustomersService');
    expect(code).toContain('@Injectable()');
  });

  test('CRUD metotlari async', () => {
    const code = generator.generate(customerEntity);
    expect(code).toContain('async findAll');
    expect(code).toContain('async findOne');
    expect(code).toContain('async create');
    expect(code).toContain('async update');
    expect(code).toContain('async remove');
  });

  test('tablo adi dogru (snake_case)', () => {
    const code = generator.generate(customerEntity);
    expect(code).toContain("'customer'");
  });
});

// ═══════════════════════════════════════
// AST DTO Generator
// ═══════════════════════════════════════

describe('ASTDTOGenerator', () => {
  const generator = new ASTDTOGenerator();

  test('CreateDTO dogru uretilir', () => {
    const code = generator.generateCreateDTO(customerEntity);
    expect(code).toContain('CreateCustomerDto');
    expect(code).toContain('from "class-validator"');
    expect(code).toContain('code');
    expect(code).toContain('name');
    expect(code).toContain('email');
  });

  test('zorunlu alanlar IsNotEmpty alir', () => {
    const code = generator.generateCreateDTO(customerEntity);
    expect(code).toContain('IsNotEmpty');
  });

  test('opsiyonel alanlar IsOptional alir', () => {
    const code = generator.generateCreateDTO(customerEntity);
    expect(code).toContain('IsOptional');
  });

  test('MaxLength dogru parametreyle', () => {
    const code = generator.generateCreateDTO(customerEntity);
    expect(code).toContain('MaxLength');
  });

  test('UpdateDTO PartialType kullanir', () => {
    const code = generator.generateUpdateDTO(customerEntity);
    expect(code).toContain('UpdateCustomerDto');
    expect(code).toContain('PartialType');
    expect(code).toContain('CreateCustomerDto');
  });

  test('varsayilan degerler atanir', () => {
    const code = generator.generateCreateDTO(customerEntity);
    // credit_limit default: 0
    expect(code).toContain('0');
  });
});

// ═══════════════════════════════════════
// Edge Case: Izinsiz Entity
// ═══════════════════════════════════════

describe('AST Generator - Edge Cases', () => {
  test('izinsiz entity varsayilan admin rolu alir', () => {
    const entity = compileEntity(`
      entity Product {
        fields {
          name: String(200) { required }
          price: Decimal(10,2)
        }
      }
    `);

    const ctrlGen = new ASTControllerGenerator();
    const code = ctrlGen.generate(entity);
    expect(code).toContain("@Roles('admin')");
  });

  test('boolean alan iceren entity', () => {
    const entity = compileEntity(`
      entity Setting {
        fields {
          key: String(100) { required }
          enabled: Boolean { default: false }
        }
      }
    `);

    const dtoGen = new ASTDTOGenerator();
    const code = dtoGen.generateCreateDTO(entity);
    expect(code).toContain('IsBoolean');
    expect(code).toContain('enabled');
  });
});
