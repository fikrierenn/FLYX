/**
 * FLYX Tip Eşleme Motoru (Type Mapper)
 * =====================================
 * FSL (FLYX Schema Language) veri tiplerini TypeScript tipleri, NestJS
 * validasyon dekoratörleri ve HTML input tiplerine dönüştüren modül.
 *
 * Dört ana sorumluluk:
 * 1. FSL → TypeScript tip eşlemesi (String → string, Money → number vb.)
 * 2. FSL → class-validator dekoratör eşlemesi (Email → @IsEmail() vb.)
 * 3. FSL → HTML input tipi eşlemesi (Email → 'email', Date → 'date' vb.)
 * 4. Varsayılan değer üretimi (Number → 0, Boolean → false vb.)
 *
 * Tip Eşleme Kararları:
 * - Date/DateTime → string: ISO 8601 formatında tutulur, Date nesnesi kullanılmaz
 *   çünkü JSON serileştirmede sorun çıkarabilir
 * - Money/Decimal → number: Hassasiyet kaybı riski var ama frontend'de pratik kullanım
 *   için number tercih edilir (gerçek para hesaplamalarında backend'de Decimal kullanılmalı)
 * - Relation → string: İlişkili entity'nin ID'si string olarak tutulur (UUID desteği)
 * - File/Image → string: Dosya yolu veya URL olarak saklanır
 * - JSON → Record<string, any>: Tip güvenliği azalır ama esneklik sağlar
 */

import type { FieldDeclaration, DataType, FieldConstraints } from '@flyx/fsl-compiler';

// ═══════════════════════════════════════
// FSL → TypeScript Tip Eşlemesi
// ═══════════════════════════════════════

/**
 * FSL veri tipinden TypeScript tipine eşleme tablosu.
 * Bilinmeyen tipler 'any' olarak eşlenir.
 *
 * Eşleme mantığı:
 * - Metin tabanlı tipler (String, Email, Phone, URL, Text, Enum) → string
 * - Sayısal tipler (Number, Decimal, Money) → number
 * - Tarih tipleri (Date, DateTime) → string (ISO 8601 formatı)
 * - Yapısal tipler (JSON) → Record<string, any>
 * - Referans tipleri (Relation, File, Image) → string (ID veya URL)
 */
const TS_TYPE_MAP: Record<string, string> = {
  String: 'string',
  Email: 'string',
  Phone: 'string',
  URL: 'string',
  Text: 'string',
  Enum: 'string',
  Number: 'number',
  Decimal: 'number',
  Money: 'number',
  Boolean: 'boolean',
  Date: 'string',       // ISO 8601 tarih formatı (YYYY-MM-DD)
  DateTime: 'string',   // ISO 8601 tarih-saat formatı
  JSON: 'Record<string, any>',
  Relation: 'string',   // İlişkili entity'nin UUID'si
  File: 'string',       // Dosya yolu veya URL
  Image: 'string',      // Görsel dosya yolu veya URL
  Array: 'any[]',
  Lookup: 'string',     // Rapor parametresinde entity referansi (UUID)
  DateRange: '{ start: string; end: string }', // Tarih araligi
  Computed: 'any',      // Hesaplanmis alan (runtime)
};

/**
 * FSL DataType'ı TypeScript tipine dönüştürür.
 * Eşleme tablosunda bulunmayan tipler 'any' olarak döner.
 */
export function mapToTSType(dataType: DataType): string {
  return TS_TYPE_MAP[dataType.name] || 'any';
}

/**
 * Bir FSL alanını (field) TypeScript tipine dönüştürür.
 * Şu anda sadece temel tip eşlemesi yapar, ileride array/nullable desteği eklenebilir.
 */
export function mapFieldToTSType(field: FieldDeclaration): string {
  const base = mapToTSType(field.dataType);
  return base;
}

/**
 * Alanın opsiyonel (zorunlu olmayan) olup olmadığını kontrol eder.
 * required constraint'i yoksa alan opsiyoneldir.
 */
export function isFieldOptional(field: FieldDeclaration): boolean {
  return !field.constraints?.required;
}

// ═══════════════════════════════════════
// FSL → Validasyon Dekoratörleri
// ═══════════════════════════════════════

/**
 * Bir validasyon dekoratörünü temsil eder.
 * NestJS DTO'larında class-validator dekoratörleri olarak kullanılır.
 */
export interface ValidationDecorator {
  /** Dekoratör adı (örn: 'IsString', 'IsEmail', 'MaxLength') */
  name: string;
  /** Dekoratör argümanları (örn: '200' veya "['active', 'inactive']") */
  args?: string;
  /** Import edilecek paket adı (şu anda hep 'class-validator') */
  importFrom: string;
}

/**
 * Bir FSL alanı için gerekli tüm validasyon dekoratörlerini üretir.
 *
 * İki katmanlı eşleme yapılır:
 * 1. Tip tabanlı dekoratörler: Veri tipine göre (String→@IsString, Email→@IsEmail vb.)
 * 2. Constraint tabanlı dekoratörler: Kısıtlamalara göre (required→@IsNotEmpty, min→@Min vb.)
 *
 * @param field - FSL alan tanımı
 * @returns Uygulanması gereken dekoratör listesi
 */
export function mapToValidatorDecorators(field: FieldDeclaration): ValidationDecorator[] {
  const decorators: ValidationDecorator[] = [];
  const dt = field.dataType;
  const c = field.constraints;

  // Katman 1: Tip tabanlı validatörler - veri tipinin doğruluğunu kontrol eder
  switch (dt.name) {
    case 'String':
    case 'Phone':
    case 'URL':
    case 'Text':
    case 'Enum':
      decorators.push({ name: 'IsString', importFrom: 'class-validator' });
      break;
    case 'Email':
      // Email için özel dekoratör - format doğrulaması da yapar
      decorators.push({ name: 'IsEmail', importFrom: 'class-validator' });
      break;
    case 'Number':
    case 'Decimal':
    case 'Money':
      decorators.push({ name: 'IsNumber', importFrom: 'class-validator' });
      break;
    case 'Boolean':
      decorators.push({ name: 'IsBoolean', importFrom: 'class-validator' });
      break;
  }

  // Katman 2: Constraint tabanlı validatörler - alan kısıtlamalarını kontrol eder
  if (c?.required) {
    // Zorunlu alanlar boş olamaz
    decorators.push({ name: 'IsNotEmpty', importFrom: 'class-validator' });
  }

  if (!c?.required) {
    // Opsiyonel alanlar null/undefined olabilir
    decorators.push({ name: 'IsOptional', importFrom: 'class-validator' });
  }

  // String uzunluk sınırı - FSL'de String(200) gibi parametre ile belirtilir
  if (dt.name === 'String' && dt.params?.[0]) {
    decorators.push({ name: 'MaxLength', args: String(dt.params[0]), importFrom: 'class-validator' });
  }

  // Minimum değer kısıtlaması (sayısal alanlar için)
  if (c?.min !== undefined) {
    decorators.push({ name: 'Min', args: String(c.min), importFrom: 'class-validator' });
  }

  // Maksimum değer kısıtlaması (sayısal alanlar için)
  if (c?.max !== undefined) {
    decorators.push({ name: 'Max', args: String(c.max), importFrom: 'class-validator' });
  }

  // Regex desen eşleştirme (telefon numarası formatı vb.)
  if (c?.pattern) {
    decorators.push({ name: 'Matches', args: `/${c.pattern}/`, importFrom: 'class-validator' });
  }

  // Enum değer kısıtlaması - sadece belirtilen değerler kabul edilir
  if (dt.name === 'Enum' && c?.values) {
    const enumArr = c.values.map((v) => `'${v}'`).join(', ');
    decorators.push({ name: 'IsIn', args: `[${enumArr}]`, importFrom: 'class-validator' });
  }

  return decorators;
}

/**
 * Dekoratör listesini TypeScript dekoratör söz dizimine dönüştürür.
 * Her dekoratör yeni satırda, uygun girinti ile formatlanır.
 *
 * Örnek çıktı:
 *   @IsString()
 *   @IsNotEmpty()
 *   @MaxLength(200)
 */
export function formatDecorators(decorators: ValidationDecorator[]): string {
  return decorators
    .map((d) => (d.args ? `@${d.name}(${d.args})` : `@${d.name}()`))
    .join('\n  ');
}

/**
 * Birden fazla alanın validatör import'larını toplar ve tekilleştirir.
 * Aynı dekoratör birden fazla alanda kullanılsa bile sadece bir kez import edilir.
 * Sonuç alfabetik sırayla döner (tutarlı kod üretimi için).
 */
export function collectValidatorImports(fields: FieldDeclaration[]): string[] {
  const imports = new Set<string>();
  for (const field of fields) {
    for (const dec of mapToValidatorDecorators(field)) {
      imports.add(dec.name);
    }
  }
  return Array.from(imports).sort();
}

// ═══════════════════════════════════════
// FSL → HTML Input Tipleri
// ═══════════════════════════════════════

/**
 * FSL veri tipinden HTML input tipine eşleme tablosu.
 * React form üretiminde kullanılır.
 *
 * Özel durumlar:
 * - Text → 'textarea': Uzun metin alanları için <textarea> kullanılır
 * - Enum/Relation → 'select': Seçim listesi olarak gösterilir
 * - File/Image → 'file': Dosya yükleme input'u
 * - DateTime → 'datetime-local': Tarayıcı yerleşik tarih-saat seçici
 */
const INPUT_TYPE_MAP: Record<string, string> = {
  String: 'text',
  Email: 'email',
  Phone: 'tel',
  URL: 'url',
  Number: 'number',
  Decimal: 'number',
  Money: 'number',
  Boolean: 'checkbox',
  Date: 'date',
  DateTime: 'datetime-local',
  Text: 'textarea',
  Enum: 'select',
  Relation: 'select',
  File: 'file',
  Image: 'file',
  Lookup: 'select',
  DateRange: 'date',
};

/**
 * FSL veri tipini HTML input tipine dönüştürür.
 * Bilinmeyen tipler varsayılan olarak 'text' döner.
 */
export function mapToInputType(dataType: DataType): string {
  return INPUT_TYPE_MAP[dataType.name] || 'text';
}

// ═══════════════════════════════════════
// Varsayılan Değerler
// ═══════════════════════════════════════

/**
 * Bir FSL alanı için TypeScript varsayılan değerini üretir.
 * Önce constraint'teki default değere bakar, yoksa tipe göre mantıklı bir
 * varsayılan döner.
 *
 * Varsayılan değer stratejisi:
 * - Sayısal tipler → 0 (sıfır)
 * - Boolean → false
 * - Diğer tüm tipler → '' (boş string)
 */
export function getDefaultValue(field: FieldDeclaration): string {
  // Constraint'te belirtilmiş varsayılan değer varsa onu kullan
  if (field.constraints?.default !== undefined) {
    const d = field.constraints.default;
    if (typeof d === 'string') return `'${d}'`;
    return String(d);
  }
  // Tipe göre mantıklı varsayılan değer döndür
  switch (field.dataType.name) {
    case 'Number':
    case 'Decimal':
    case 'Money':
      return '0';
    case 'Boolean':
      return 'false';
    default:
      return "''";
  }
}

/**
 * Bir değeri TypeScript varsayılan atama söz dizimine dönüştürür.
 * Undefined ise boş string döner (varsayılan değer yok demektir).
 *
 * Örnek: formatTSDefault('active', 'string') → " = 'active'"
 */
export function formatTSDefault(value: unknown, tsType: string): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return ` = '${value}'`;
  return ` = ${value}`;
}
