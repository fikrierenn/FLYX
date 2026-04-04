/**
 * AST Tabanlı NestJS DTO Üretici
 * ================================
 * ts-morph ile class-validator dekoratörlü DTO sınıfları üretir.
 * Her alan için uygun validasyon dekoratörleri otomatik eklenir.
 */

import { Project, Scope } from 'ts-morph';
import type { EntityDeclaration, FieldDeclaration } from '@flyx/fsl-compiler';
import { toKebabCase } from '../../core/naming/index.js';
import {
  mapToTSType,
  mapToValidatorDecorators,
  isFieldOptional,
  getDefaultValue,
} from '../../core/type-mapper/index.js';

export class ASTDTOGenerator {
  private project: Project;

  constructor() {
    this.project = new Project({ useInMemoryFileSystem: true });
  }

  generateCreateDTO(entity: EntityDeclaration): string {
    const className = `Create${entity.name}Dto`;
    const fields = entity.fields.filter((f) => f.dataType.name !== 'Computed');

    const sourceFile = this.project.createSourceFile(
      `create-${toKebabCase(entity.name)}.dto.ts`,
      '',
      { overwrite: true },
    );

    // Kullanılan validator isimlerini topla → import için
    const validatorNames = new Set<string>();
    for (const field of fields) {
      for (const dec of mapToValidatorDecorators(field)) {
        validatorNames.add(dec.name);
      }
    }

    if (validatorNames.size > 0) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'class-validator',
        namedImports: Array.from(validatorNames).sort(),
      });
    }

    // DTO sınıfı
    const cls = sourceFile.addClass({
      name: className,
      isExported: true,
    });

    // Her alan için property + dekoratörler ekle
    for (const field of fields) {
      const decorators = mapToValidatorDecorators(field);
      const tsType = mapToTSType(field.dataType);
      const optional = isFieldOptional(field);

      cls.addProperty({
        name: field.name,
        type: tsType,
        hasQuestionToken: optional,
        initializer: field.constraints?.default !== undefined
          ? this.formatInit(field.constraints.default)
          : undefined,
        decorators: decorators.map((d) => ({
          name: d.name,
          arguments: d.args ? [d.args] : [],
        })),
      });
    }

    sourceFile.formatText();
    return sourceFile.getFullText();
  }

  generateUpdateDTO(entity: EntityDeclaration): string {
    const createDto = `Create${entity.name}Dto`;
    const updateDto = `Update${entity.name}Dto`;

    const sourceFile = this.project.createSourceFile(
      `update-${toKebabCase(entity.name)}.dto.ts`,
      '',
      { overwrite: true },
    );

    sourceFile.addImportDeclaration({
      moduleSpecifier: '@nestjs/mapped-types',
      namedImports: ['PartialType'],
    });
    sourceFile.addImportDeclaration({
      moduleSpecifier: `./create-${toKebabCase(entity.name)}.dto`,
      namedImports: [createDto],
    });

    sourceFile.addClass({
      name: updateDto,
      isExported: true,
      extends: `PartialType(${createDto})`,
    });

    sourceFile.formatText();
    return sourceFile.getFullText();
  }

  private formatInit(value: unknown): string {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    return "''";
  }
}
