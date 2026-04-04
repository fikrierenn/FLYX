/**
 * FLYX Validasyon Motoru
 * ======================
 * FSL alan kısıtlamalarından (field constraints) NestJS class-validator
 * dekoratörleri ve DTO (Data Transfer Object) alan kodları üreten modül.
 *
 * Bu modül, type-mapper modülünü kullanarak FSL tanımlarını doğrudan
 * kullanılabilir DTO property koduna dönüştürür.
 *
 * Dönüşüm örneği:
 *   FSL girdi:  name: String(200) { required }
 *   TS çıktı:   @IsString()
 *               @IsNotEmpty()
 *               @MaxLength(200)
 *               name: string;
 *
 * Bağımlılıklar:
 * - type-mapper: Tip eşleme ve dekoratör üretimi
 * - class-validator: Runtime validasyon kütüphanesi (üretilen kodda kullanılır)
 */

import type { FieldDeclaration } from '@flyx/fsl-compiler';
import {
  mapToValidatorDecorators,
  formatDecorators,
  collectValidatorImports,
  mapFieldToTSType,
  isFieldOptional,
  getDefaultValue,
  type ValidationDecorator,
} from '../type-mapper/index.js';

/**
 * Tek bir FSL alanı için DTO property kodu üretir.
 * Üretilen kod, validasyon dekoratörleri + TypeScript tip tanımı +
 * opsiyonellik işareti + varsayılan değer atamasını içerir.
 *
 * Üretim adımları:
 * 1. Alan için gerekli validasyon dekoratörlerini belirle (type-mapper'dan)
 * 2. TypeScript tipini eşle
 * 3. Zorunluluk durumuna göre '?' ekle
 * 4. Varsayılan değer varsa atama ekle
 *
 * @param field - FSL alan tanımı (FieldDeclaration)
 * @returns Dekoratörler ve tip bilgisi ile birlikte DTO property kodu
 */
export function generateDTOField(field: FieldDeclaration): string {
  const decorators = mapToValidatorDecorators(field);
  const tsType = mapFieldToTSType(field);
  const optional = isFieldOptional(field) ? '?' : '';
  const defaultVal = field.constraints?.default !== undefined
    ? ` = ${formatDefaultForTS(field.constraints.default)}`
    : '';

  const decoratorStr = formatDecorators(decorators);

  return `${decoratorStr}\n  ${field.name}${optional}: ${tsType}${defaultVal};`;
}

/**
 * Entity'nin tüm alanları için import edilecek validatör isimlerini toplar
 * ve tek bir import satırı olarak döndürür.
 * Aynı validatör birden fazla alanda kullanılsa bile sadece bir kez import edilir
 * (Set ile tekilleştirme yapılır).
 *
 * @param fields - Entity'nin alan tanımları listesi
 * @returns class-validator import satırı (boşsa boş string döner)
 */
export function generateValidatorImports(fields: FieldDeclaration[]): string {
  const imports = collectValidatorImports(fields);
  if (imports.length === 0) return '';
  return `import { ${imports.join(', ')} } from 'class-validator';`;
}

/**
 * Varsayılan değeri TypeScript literal formatına dönüştürür.
 * String değerler tek tırnak ile sarılır, sayı ve boolean olduğu gibi döner.
 * Tanınmayan tipler için boş string varsayılır.
 */
function formatDefaultForTS(value: unknown): string {
  if (typeof value === 'string') return `'${value}'`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  return "''";
}
