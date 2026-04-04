/**
 * AST Tabanlı NestJS Controller Üretici
 * =======================================
 * ts-morph kullanarak NestJS controller kodu üretir.
 * String birleştirme yerine TypeScript AST ağacı üzerinden çalışır.
 *
 * Avantajları:
 * - Tip güvenli kod üretimi (syntax hataları imkansız)
 * - Otomatik import yönetimi (kullanılmayan import'lar eklenmez)
 * - Formatlı çıktı (Prettier'a gerek kalmaz)
 * - AST manipülasyonu ile kolay genişletilebilirlik
 *
 * String-based generator hala çalışır (geriye uyumluluk).
 * Bu AST versiyonu, daha gelişmiş senaryolar için kullanılır.
 */

import { Project, SourceFile, Scope, ClassDeclaration } from 'ts-morph';
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import {
  toCamelCase, toPlural, toKebabCase,
} from '../../core/naming/index.js';

export class ASTControllerGenerator {
  private project: Project;

  constructor() {
    // InMemoryFileSystem: Disk'e yazmadan bellekte TypeScript dosyası oluşturur
    this.project = new Project({ useInMemoryFileSystem: true });
  }

  /**
   * Entity'den AST üzerinden NestJS controller kodu üretir.
   *
   * İşlem sırası:
   * 1. Bellekte boş bir .ts dosyası oluştur
   * 2. Gerekli import'ları ekle (NestJS, guard, DTO)
   * 3. Controller sınıfını oluştur (@Controller, @UseGuards dekoratörleri ile)
   * 4. CRUD metotlarını ekle (findAll, findOne, create, update, remove)
   * 5. Her metota uygun dekoratörleri ekle (@Get, @Post, @Roles vs.)
   * 6. Dosya içeriğini string olarak döndür
   */
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);
    const kebabPlural = toKebabCase(plural);
    const serviceName = `${name}sService`;
    const serviceVar = toCamelCase(serviceName);
    const createDto = `Create${name}Dto`;
    const updateDto = `Update${name}Dto`;

    const createRoles = entity.permissions?.create || ['admin'];
    const readRoles = entity.permissions?.read || ['admin'];
    const updateRoles = entity.permissions?.update || ['admin'];
    const deleteRoles = entity.permissions?.delete || ['admin'];

    // 1. Bellekte yeni bir TypeScript dosyası oluştur
    const sourceFile = this.project.createSourceFile(
      `${kebabPlural}.controller.ts`,
      '',
      { overwrite: true },
    );

    // 2. Import'ları ekle
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@nestjs/common',
      namedImports: ['Controller', 'Get', 'Post', 'Put', 'Delete', 'Body', 'Param', 'Query', 'UseGuards'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@nestjs/swagger',
      namedImports: ['ApiTags', 'ApiOperation', 'ApiBearerAuth'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: '../../common/guards/jwt-auth.guard',
      namedImports: ['JwtAuthGuard'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: '../../common/guards/roles.guard',
      namedImports: ['RolesGuard'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: '../../common/decorators',
      namedImports: ['Roles'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: `./${kebabPlural}.service`,
      namedImports: [serviceName],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: `./dto/create-${toKebabCase(name)}.dto`,
      namedImports: [createDto],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: `./dto/update-${toKebabCase(name)}.dto`,
      namedImports: [updateDto],
    });

    // 3. Controller sınıfını oluştur
    const cls = sourceFile.addClass({
      name: `${name}sController`,
      isExported: true,
      decorators: [
        { name: 'ApiTags', arguments: [`'${plural}'`] },
        { name: 'ApiBearerAuth', arguments: [] },
        { name: 'Controller', arguments: [`'${plural}'`] },
        { name: 'UseGuards', arguments: ['JwtAuthGuard', 'RolesGuard'] },
      ],
      ctors: [{
        parameters: [{
          name: serviceVar,
          type: serviceName,
          isReadonly: true,
          scope: Scope.Private,
        }],
      }],
    });

    // 4. CRUD metotlarını ekle
    this.addFindAll(cls, serviceVar, readRoles);
    this.addFindOne(cls, serviceVar, readRoles);
    this.addCreate(cls, serviceVar, createDto, createRoles);
    this.addUpdate(cls, serviceVar, updateDto, updateRoles);
    this.addRemove(cls, serviceVar, deleteRoles);

    // 5. Formatla ve döndür
    sourceFile.formatText();
    return sourceFile.getFullText();
  }

  /** GET / - Tüm kayıtları listele (sayfalama destekli) */
  private addFindAll(cls: ClassDeclaration, serviceVar: string, roles: string[]) {
    cls.addMethod({
      name: 'findAll',
      decorators: [
        { name: 'Get', arguments: [] },
        { name: 'Roles', arguments: roles.map((r) => `'${r}'`) },
        { name: 'ApiOperation', arguments: [`{ summary: 'List all' }`] },
      ],
      parameters: [
        { name: 'page', type: 'number', hasQuestionToken: true, decorators: [{ name: 'Query', arguments: ["'page'"] }] },
        { name: 'limit', type: 'number', hasQuestionToken: true, decorators: [{ name: 'Query', arguments: ["'limit'"] }] },
      ],
      statements: [`return this.${serviceVar}.findAll({ page, limit });`],
    });
  }

  /** GET /:id - Tek kayıt getir */
  private addFindOne(cls: ClassDeclaration, serviceVar: string, roles: string[]) {
    cls.addMethod({
      name: 'findOne',
      decorators: [
        { name: 'Get', arguments: ["':id'"] },
        { name: 'Roles', arguments: roles.map((r) => `'${r}'`) },
        { name: 'ApiOperation', arguments: [`{ summary: 'Get by ID' }`] },
      ],
      parameters: [
        { name: 'id', type: 'string', decorators: [{ name: 'Param', arguments: ["'id'"] }] },
      ],
      statements: [`return this.${serviceVar}.findOne(id);`],
    });
  }

  /** POST / - Yeni kayıt oluştur */
  private addCreate(cls: ClassDeclaration, serviceVar: string, dtoName: string, roles: string[]) {
    cls.addMethod({
      name: 'create',
      decorators: [
        { name: 'Post', arguments: [] },
        { name: 'Roles', arguments: roles.map((r) => `'${r}'`) },
        { name: 'ApiOperation', arguments: [`{ summary: 'Create new' }`] },
      ],
      parameters: [
        { name: 'dto', type: dtoName, decorators: [{ name: 'Body', arguments: [] }] },
      ],
      statements: [`return this.${serviceVar}.create(dto);`],
    });
  }

  /** PUT /:id - Mevcut kaydı güncelle */
  private addUpdate(cls: ClassDeclaration, serviceVar: string, dtoName: string, roles: string[]) {
    cls.addMethod({
      name: 'update',
      decorators: [
        { name: 'Put', arguments: ["':id'"] },
        { name: 'Roles', arguments: roles.map((r) => `'${r}'`) },
        { name: 'ApiOperation', arguments: [`{ summary: 'Update' }`] },
      ],
      parameters: [
        { name: 'id', type: 'string', decorators: [{ name: 'Param', arguments: ["'id'"] }] },
        { name: 'dto', type: dtoName, decorators: [{ name: 'Body', arguments: [] }] },
      ],
      statements: [`return this.${serviceVar}.update(id, dto);`],
    });
  }

  /** DELETE /:id - Kayıt sil */
  private addRemove(cls: ClassDeclaration, serviceVar: string, roles: string[]) {
    cls.addMethod({
      name: 'remove',
      decorators: [
        { name: 'Delete', arguments: ["':id'"] },
        { name: 'Roles', arguments: roles.map((r) => `'${r}'`) },
        { name: 'ApiOperation', arguments: [`{ summary: 'Delete' }`] },
      ],
      parameters: [
        { name: 'id', type: 'string', decorators: [{ name: 'Param', arguments: ["'id'"] }] },
      ],
      statements: [`return this.${serviceVar}.remove(id);`],
    });
  }
}
