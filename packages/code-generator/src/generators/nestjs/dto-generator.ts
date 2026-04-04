/**
 * FLYX NestJS DTO (Data Transfer Object) Üretici
 * =================================================
 * FSL entity tanımından NestJS DTO sınıfları üretir.
 * İki tip DTO üretilir:
 *
 * 1. CreateDTO: Yeni kayıt oluşturmak için - tüm alanlar dahil (Computed hariç)
 * 2. UpdateDTO: Mevcut kaydı güncellemek için - PartialType ile tüm alanlar opsiyonel
 *
 * DTO'lar class-validator dekoratörleri ile donatılır:
 * - Tip doğrulama: @IsString, @IsEmail, @IsNumber, @IsBoolean
 * - Uzunluk sınırı: @MaxLength (String parametresinden)
 * - Değer aralığı: @Min, @Max (constraint'lerden)
 * - Opsiyonellik: @IsOptional (zorunlu olmayan alanlar için)
 *
 * Computed alanlar filtrelenir çünkü bu alanlar sunucu tarafında
 * hesaplanır ve istemciden gelmemelidir.
 */

import type { EntityDeclaration, FieldDeclaration } from '@flyx/fsl-compiler';

/**
 * NestJS DTO üretici sınıfı.
 * Her entity için Create ve Update DTO'larını ayrı ayrı üretir.
 */
export class NestJSDTOGenerator {
  /**
   * CreateDTO sınıfı üretir.
   * Computed alanlar hariç tüm entity alanlarını içerir.
   * Her alan, veri tipine göre uygun validasyon dekoratörleri ile donatılır.
   *
   * @param entity - FSL entity tanımı
   * @returns CreateDTO TypeScript kaynak kodu
   */
  generateCreateDTO(entity: EntityDeclaration): string {
    const className = `Create${entity.name}Dto`;
    // Computed alanlar istemciden gelmez, bu yüzden filtrelenir
    const fields = entity.fields
      .filter((f) => f.dataType.name !== 'Computed')
      .map((f) => this.generateField(f))
      .join('\n\n  ');

    return `import { IsString, IsEmail, IsNumber, IsBoolean, IsOptional, MaxLength, Min, Max } from 'class-validator';

export class ${className} {
  ${fields}
}`;
  }

  /**
   * UpdateDTO sınıfı üretir.
   * NestJS PartialType kullanarak CreateDTO'nun tüm alanlarını opsiyonel yapar.
   * Bu sayede güncelleme sırasında sadece değişen alanlar gönderilir (PATCH semantiği).
   *
   * @param entity - FSL entity tanımı
   * @returns UpdateDTO TypeScript kaynak kodu
   */
  generateUpdateDTO(entity: EntityDeclaration): string {
    const createDto = `Create${entity.name}Dto`;
    const updateDto = `Update${entity.name}Dto`;

    return `import { PartialType } from '@nestjs/mapped-types';
import { ${createDto} } from './create-${entity.name.toLowerCase()}.dto';

export class ${updateDto} extends PartialType(${createDto}) {}`;
  }

  /**
   * Tek bir alan için DTO property kodu üretir.
   * Veri tipine göre uygun validasyon dekoratörlerini belirler ve
   * TypeScript tip tanımı ile birleştirir.
   *
   * @param field - FSL alan tanımı
   * @returns Dekoratörler ile birlikte alan tanım kodu
   */
  private generateField(field: FieldDeclaration): string {
    const decorators: string[] = [];
    const isRequired = field.constraints?.required;

    // Veri tipine göre uygun validasyon dekoratörünü seç
    switch (field.dataType.name) {
      case 'String':
        decorators.push('@IsString()');
        // String(200) gibi parametre varsa maksimum uzunluk kısıtlaması ekle
        if (field.dataType.params?.[0]) {
          decorators.push(`@MaxLength(${field.dataType.params[0]})`);
        }
        break;
      case 'Email':
        // Email formatı doğrulaması (RFC 5322 uyumlu)
        decorators.push('@IsEmail()');
        break;
      case 'Number':
        decorators.push('@IsNumber()');
        // Min/Max constraint'leri varsa sayısal aralık kısıtlaması ekle
        if (field.constraints?.min !== undefined) decorators.push(`@Min(${field.constraints.min})`);
        if (field.constraints?.max !== undefined) decorators.push(`@Max(${field.constraints.max})`);
        break;
      case 'Decimal':
      case 'Money':
        // Ondalık ve para tipleri de sayısal olarak doğrulanır
        decorators.push('@IsNumber()');
        break;
      case 'Boolean':
        decorators.push('@IsBoolean()');
        break;
      case 'Phone':
      case 'URL':
      case 'Text':
      case 'Enum':
        // Bu tipler string tabanlıdır, ek format doğrulaması ileride eklenebilir
        decorators.push('@IsString()');
        break;
    }

    // Zorunlu olmayan alanlar @IsOptional ile işaretlenir
    if (!isRequired) {
      decorators.push('@IsOptional()');
    }

    const tsType = this.mapToTSType(field.dataType.name);
    const optional = !isRequired ? '?' : '';
    // Varsayılan değer varsa TypeScript atama söz dizimi ile ekle
    const defaultVal = field.constraints?.default !== undefined
      ? ` = ${this.formatDefault(field.constraints.default, field.dataType.name)}`
      : '';

    return `${decorators.join('\n  ')}\n  ${field.name}${optional}: ${tsType}${defaultVal};`;
  }

  /**
   * FSL veri tipini TypeScript tipine dönüştürür.
   * Bu, type-mapper modülünün basitleştirilmiş bir kopyasıdır
   * (DTO generator'ın bağımsız çalışabilmesi için).
   */
  private mapToTSType(fslType: string): string {
    const map: Record<string, string> = {
      String: 'string', Email: 'string', Phone: 'string', URL: 'string',
      Text: 'string', Enum: 'string',
      Number: 'number', Decimal: 'number', Money: 'number',
      Boolean: 'boolean',
      Date: 'string', DateTime: 'string',
      JSON: 'Record<string, any>',
      Relation: 'string',
    };
    return map[fslType] || 'any';
  }

  /**
   * Varsayılan değeri TypeScript literal formatına dönüştürür.
   * String → tek tırnaklı, sayı/boolean → olduğu gibi, diğer → boş string.
   */
  private formatDefault(value: unknown, type: string): string {
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    return "''";
  }
}
