/**
 * FLYX Kod Üretici - Ana API Modülü
 * ===================================
 * FSL (FLYX Schema Language) AST'den otomatik TypeScript + React kodu üreten motor.
 *
 * Bu dosya paketin ana giriş noktasıdır ve iki kullanım modunu destekler:
 *
 * 1. Basit Mod (v1 uyumlu):
 *    CodeGenerator sınıfı ile tek satırda tüm dosyaları üretir.
 *    Mevcut testler ve eski entegrasyonlar için geriye dönük uyumlu.
 *
 *    const gen = new CodeGenerator();
 *    const files = gen.generate(customerEntity);
 *    // files.nestjs.controller → NestJS controller kodu
 *    // files.react.listPage → React liste sayfası kodu
 *
 * 2. Gelişmiş Mod (v2 - Strategy + Plugin):
 *    GeneratorEngine ile özel generator ve plugin desteği.
 *    Farklı framework'ler ve özel gereksinimler için genişletilebilir.
 *
 *    const engine = new GeneratorEngine();
 *    engine.registerPlugin(auditPlugin);
 *    const files = engine.generate(entity, { backend: 'nestjs', frontend: 'react' });
 *
 * Dışa Aktarılan Modüller:
 * - CodeGenerator: V1 basit üretici sınıfı
 * - GeneratorEngine: V2 strateji tabanlı üretim motoru
 * - Naming: İsimlendirme yardımcıları (pluralization, case conversion)
 * - TypeMapper: Tip eşleme fonksiyonları (FSL → TS, HTML, Validator)
 * - Validation: Validasyon dekoratör üretimi
 * - Emitter: Programatik kod üretim yardımcıları
 * - AST Generators: ts-morph tabanlı gelişmiş AST üreticileri
 * - StringHelpers: V1 uyumlu string fonksiyonları
 */

import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { NestJSControllerGenerator } from './generators/nestjs/controller-generator.js';
import { NestJSServiceGenerator } from './generators/nestjs/service-generator.js';
import { NestJSDTOGenerator } from './generators/nestjs/dto-generator.js';
import { ReactListPageGenerator } from './generators/react/list-page-generator.js';
import { ReactFormModalGenerator } from './generators/react/form-modal-generator.js';
import { ReactStoreGenerator } from './generators/react/store-generator.js';
import { toPlural } from './utils/string-helpers.js';

// ═══════════════════════════════════════
// V1 Uyumlu Arayüz (Mevcut testler için)
// ═══════════════════════════════════════

/**
 * CodeGenerator.generate() metodunun döndürdüğü üretilmiş dosyalar yapısı.
 * Backend (NestJS) ve frontend (React) dosyalarını gruplar halinde içerir.
 */
export interface GeneratedFiles {
  /** NestJS backend dosyaları */
  nestjs: {
    /** REST API controller kodu */
    controller: string;
    /** İş mantığı service kodu */
    service: string;
    /** NestJS modül tanımı */
    module: string;
    /** Oluşturma DTO'su (validasyon dekoratörleri dahil) */
    createDto: string;
    /** Güncelleme DTO'su (tüm alanlar opsiyonel) */
    updateDto: string;
  };
  /** React frontend dosyaları */
  react: {
    /** Tablo görünümlü liste sayfası bileşeni */
    listPage: string;
    /** Create/Edit form modal bileşeni */
    formModal: string;
    /** Zustand state management store'u */
    store: string;
  };
}

/**
 * Basit kod üretici - v1 uyumlu.
 * Entity'den NestJS backend + React frontend kodu üretir.
 * Tüm alt generator'ları (controller, service, DTO, page, modal, store)
 * tek bir generate() çağrısı ile çalıştırır.
 *
 * Her alt generator bağımsız bir sınıftır ve tek başına da kullanılabilir.
 */
export class CodeGenerator {
  /** NestJS controller üretici */
  private controllerGen = new NestJSControllerGenerator();
  /** NestJS service üretici */
  private serviceGen = new NestJSServiceGenerator();
  /** NestJS DTO (Create + Update) üretici */
  private dtoGen = new NestJSDTOGenerator();
  /** React liste sayfası üretici */
  private listPageGen = new ReactListPageGenerator();
  /** React form modal üretici */
  private formModalGen = new ReactFormModalGenerator();
  /** Zustand store üretici */
  private storeGen = new ReactStoreGenerator();

  /**
   * Entity'den tüm backend ve frontend dosyalarını üretir.
   *
   * @param entity - FSL entity tanımı (derleyiciden gelen AST düğümü)
   * @returns Gruplandırılmış üretilmiş dosyalar (nestjs + react)
   */
  generate(entity: EntityDeclaration): GeneratedFiles {
    return {
      nestjs: {
        controller: this.controllerGen.generate(entity),
        service: this.serviceGen.generate(entity),
        module: this.generateModule(entity),
        createDto: this.dtoGen.generateCreateDTO(entity),
        updateDto: this.dtoGen.generateUpdateDTO(entity),
      },
      react: {
        listPage: this.listPageGen.generate(entity),
        formModal: this.formModalGen.generate(entity),
        store: this.storeGen.generate(entity),
      },
    };
  }

  /**
   * NestJS modül tanımı üretir.
   * Controller ve Service'i birbirine bağlayan NestJS modülü oluşturur.
   * Service dışa aktarılır (exports) - diğer modüllerden kullanılabilir.
   */
  private generateModule(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);

    return `import { Module } from '@nestjs/common';
import { ${name}sController } from './${plural}.controller';
import { ${name}sService } from './${plural}.service';

@Module({
  controllers: [${name}sController],
  providers: [${name}sService],
  exports: [${name}sService],
})
export class ${name}sModule {}`;
  }
}

// ═══════════════════════════════════════
// Generator'lar (Framework'e Özel)
// ═══════════════════════════════════════
// Her generator bağımsız olarak import edilip kullanılabilir.

export { NestJSControllerGenerator } from './generators/nestjs/controller-generator.js';
export { NestJSServiceGenerator } from './generators/nestjs/service-generator.js';
export { NestJSDTOGenerator } from './generators/nestjs/dto-generator.js';
export { ReactListPageGenerator } from './generators/react/list-page-generator.js';
export { ReactFormModalGenerator } from './generators/react/form-modal-generator.js';
export { ReactStoreGenerator } from './generators/react/store-generator.js';

// AST tabanlı generator'lar (ts-morph ile ileri seviye kod üretimi)
// Bu generator'lar string şablon yerine AST manipülasyonu kullanır,
// böylece daha güvenli ve yapısal olarak doğru kod üretilir.
export { ASTControllerGenerator } from './generators/nestjs-ast/ast-controller-generator.js';
export { ASTServiceGenerator } from './generators/nestjs-ast/ast-service-generator.js';
export { ASTDTOGenerator } from './generators/nestjs-ast/ast-dto-generator.js';

// ═══════════════════════════════════════
// Core Altyapı (Yeni v2 - Strategy + Plugin)
// ═══════════════════════════════════════
// GeneratorEngine: Özelleştirilebilir üretim motoru
// Generator/Plugin tipleri: Kendi generator ve plugin'lerinizi yazın

export { GeneratorEngine } from './core/generator-engine.js';
export type {
  Generator,
  MultiFileGenerator,
  GeneratedFile,
  GeneratorOptions,
  GeneratorPlugin,
  HookContext,
} from './core/types.js';

// İsimlendirme Motoru - çoğullama, case dönüşümleri, entity isimlendirme
export {
  toPlural, toSingular,
  toPascalCase, toCamelCase, toKebabCase, toSnakeCase,
  toControllerName, toServiceName, toModuleName,
  toCreateDtoName, toUpdateDtoName,
  toStoreName, toPageName, toFormModalName,
  toLabel, toApiPath,
} from './core/naming/index.js';

// Tip Eşleme - FSL tiplerinden TS/HTML/Validator dönüşümleri
export {
  mapToTSType, mapFieldToTSType, isFieldOptional,
  mapToValidatorDecorators, formatDecorators, collectValidatorImports,
  mapToInputType, getDefaultValue,
} from './core/type-mapper/index.js';

// Validasyon - DTO alan kodu ve import üretimi
export {
  generateDTOField, generateValidatorImports,
} from './core/validation/index.js';

// Kod Yayıcı - programatik kod üretimi yardımcıları
export { CodeEmitter, interpolate, dedent } from './core/emitter/index.js';

// String yardımcıları (v1 uyumlu - eski import'lar için geriye dönük uyumluluk)
export * from './utils/string-helpers.js';
