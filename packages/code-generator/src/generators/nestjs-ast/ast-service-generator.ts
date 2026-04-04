/**
 * AST Tabanlı NestJS Service Üretici
 * ====================================
 * ts-morph ile NestJS service (iş mantığı) katmanı kodu üretir.
 * TypeScript AST ağacı üzerinden tip güvenli kod üretimi sağlar.
 */

import { Project, Scope } from 'ts-morph';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toCamelCase, toPlural, toKebabCase, toSnakeCase } from '../../core/naming/index.js';

export class ASTServiceGenerator {
  private project: Project;

  constructor() {
    this.project = new Project({ useInMemoryFileSystem: true });
  }

  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);
    const tableName = toSnakeCase(name);
    const createDto = `Create${name}Dto`;
    const updateDto = `Update${name}Dto`;

    const sourceFile = this.project.createSourceFile(
      `${toKebabCase(plural)}.service.ts`,
      '',
      { overwrite: true },
    );

    // Import'lar
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@nestjs/common',
      namedImports: ['Injectable', 'NotFoundException'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: `./dto/create-${toKebabCase(name)}.dto`,
      namedImports: [createDto],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: `./dto/update-${toKebabCase(name)}.dto`,
      namedImports: [updateDto],
    });

    // Service sınıfı
    const cls = sourceFile.addClass({
      name: `${name}sService`,
      isExported: true,
      decorators: [{ name: 'Injectable', arguments: [] }],
      properties: [{
        name: 'tableName',
        isReadonly: true,
        scope: Scope.Private,
        initializer: `'${tableName}'`,
      }],
    });

    // findAll: Sayfalama destekli listeleme
    cls.addMethod({
      name: 'findAll',
      isAsync: true,
      parameters: [{ name: 'options', type: '{ page?: number; limit?: number }', hasQuestionToken: true }],
      statements: [
        'const page = options?.page || 1;',
        'const limit = options?.limit || 20;',
        'const offset = (page - 1) * limit;',
        '// TODO: Veritabanı sorgusu çalıştır',
        'return { data: [], total: 0, page, limit };',
      ],
    });

    // findOne: ID ile tek kayıt getirme
    cls.addMethod({
      name: 'findOne',
      isAsync: true,
      parameters: [{ name: 'id', type: 'string' }],
      statements: [
        '// TODO: Veritabanı sorgusu çalıştır',
        `// if (!result) throw new NotFoundException(\`${name} \${id} bulunamadı\`);`,
        'return { id };',
      ],
    });

    // create: Yeni kayıt oluşturma
    cls.addMethod({
      name: 'create',
      isAsync: true,
      parameters: [{ name: 'dto', type: createDto }],
      statements: [
        '// TODO: Veritabanına kaydet',
        'return { id: crypto.randomUUID(), ...dto };',
      ],
    });

    // update: Mevcut kaydı güncelleme
    cls.addMethod({
      name: 'update',
      isAsync: true,
      parameters: [{ name: 'id', type: 'string' }, { name: 'dto', type: updateDto }],
      statements: [
        '// TODO: Veritabanını güncelle',
        'return { id, ...dto };',
      ],
    });

    // remove: Kayıt silme
    cls.addMethod({
      name: 'remove',
      isAsync: true,
      parameters: [{ name: 'id', type: 'string' }],
      statements: [
        '// TODO: Veritabanından sil',
        'return { id, deleted: true };',
      ],
    });

    sourceFile.formatText();
    return sourceFile.getFullText();
  }
}
