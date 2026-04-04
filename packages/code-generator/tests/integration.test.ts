/**
 * Entegrasyon Testleri
 * =====================
 * Tam pipeline testi: FSL kodu → derleme → kod üretimi → geçerli TypeScript
 * Bu testler, üretilen kodun yapısal bütünlüğünü doğrular.
 */

import { describe, test, expect } from 'vitest';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { CodeGenerator } from '../src/index.js';
import { ASTControllerGenerator, ASTServiceGenerator, ASTDTOGenerator } from '../src/generators/nestjs-ast/index.js';

const compiler = new FSLCompiler();
const generator = new CodeGenerator();

describe('Integration: FSL -> Compile -> Generate', () => {
  test('tam Customer pipeline', () => {
    // 1. FSL kodu yaz
    const fsl = `
      entity Customer {
        fields {
          code: String(50) { required, unique, indexed }
          name: String(200) { required }
          email: Email { unique }
          phone: Phone
          credit_limit: Decimal(12,2) { default: 0 }
          status: Enum {
            values: ["active", "inactive", "blocked"],
            default: "active"
          }
          category: Relation(Category)
        }
        permissions {
          create: ["admin", "sales_manager"]
          read: ["admin", "sales_manager", "sales_rep"]
          update: ["admin", "sales_manager"]
          delete: ["admin"]
        }
      }
    `;

    // 2. Derle
    const compileResult = compiler.compile(fsl);
    expect(compileResult.ast).toHaveLength(1);
    const entity = compileResult.ast[0] as EntityDeclaration;
    expect(entity.type).toBe('EntityDeclaration');
    expect(entity.name).toBe('Customer');
    expect(entity.fields).toHaveLength(7);

    // 3. Kod uret
    const files = generator.generate(entity);

    // 4. Uretilen kodun yapisal butunlugunu dogrula
    // Controller
    expect(files.nestjs.controller).toContain('CustomersController');
    expect(files.nestjs.controller).toContain("@Controller('customers')");
    expect(files.nestjs.controller).toContain('findAll');
    expect(files.nestjs.controller).toContain('findOne');
    expect(files.nestjs.controller).toContain('create');
    expect(files.nestjs.controller).toContain('update');
    expect(files.nestjs.controller).toContain('remove');

    // Service
    expect(files.nestjs.service).toContain('CustomersService');
    expect(files.nestjs.service).toContain('@Injectable()');

    // Module
    expect(files.nestjs.module).toContain('CustomersModule');
    expect(files.nestjs.module).toContain('CustomersController');
    expect(files.nestjs.module).toContain('CustomersService');

    // DTO - zorunlu alanlar
    expect(files.nestjs.createDto).toContain('CreateCustomerDto');
    expect(files.nestjs.createDto).toContain('@IsString()');
    expect(files.nestjs.createDto).toContain('@IsEmail()');
    expect(files.nestjs.createDto).toContain('@MaxLength(50)');
    expect(files.nestjs.createDto).toContain('@MaxLength(200)');

    // Update DTO
    expect(files.nestjs.updateDto).toContain('UpdateCustomerDto');
    expect(files.nestjs.updateDto).toContain('PartialType(CreateCustomerDto)');

    // React store
    expect(files.react.store).toContain('useCustomerStore');
    expect(files.react.store).toContain('fetchCustomers');
    expect(files.react.store).toContain("'/api/customers'");

    // React page
    expect(files.react.listPage).toContain('CustomersPage');

    // React form
    expect(files.react.formModal).toContain('CustomerFormModal');
  });

  test('tam Product pipeline (izinsiz entity)', () => {
    const fsl = `
      entity Product {
        fields {
          sku: String(30) { required, unique }
          name: String(200) { required }
          price: Decimal(10,2) { required, min: 0 }
          stock: Number { default: 0 }
          is_active: Boolean { default: true }
        }
      }
    `;

    const result = compiler.compile(fsl);
    const entity = result.ast[0] as EntityDeclaration;
    const files = generator.generate(entity);

    // izin tanimlanmadiginda varsayilan admin
    expect(files.nestjs.controller).toContain("@Roles('admin')");

    // Boolean alan
    expect(files.nestjs.createDto).toContain('@IsBoolean()');

    // Number alan
    expect(files.nestjs.createDto).toContain('@IsNumber()');
  });

  test('AST-based pipeline ayni entity ile calisir', () => {
    const fsl = `
      entity Order {
        fields {
          order_no: String(20) { required, unique }
          total: Decimal(12,2) { default: 0 }
        }
      }
    `;

    const entity = compiler.compile(fsl).ast[0] as EntityDeclaration;

    const ctrlGen = new ASTControllerGenerator();
    const svcGen = new ASTServiceGenerator();
    const dtoGen = new ASTDTOGenerator();

    const controller = ctrlGen.generate(entity);
    const service = svcGen.generate(entity);
    const createDto = dtoGen.generateCreateDTO(entity);
    const updateDto = dtoGen.generateUpdateDTO(entity);

    // AST uretici de gecerli kod uretmeli
    expect(controller).toContain('OrdersController');
    expect(service).toContain('OrdersService');
    expect(createDto).toContain('CreateOrderDto');
    expect(updateDto).toContain('UpdateOrderDto');
    expect(updateDto).toContain('PartialType');
  });
});
