/**
 * FLYX İsimlendirme Motoru (Naming Engine)
 * =========================================
 * Bu modül, kod üretimi sırasında İngilizce kelime çoğullama (pluralization),
 * tekilleme (singularization), case dönüşümleri ve entity isimlendirme
 * yardımcılarını sağlar.
 *
 * Üç ana bölüm:
 * 1. Pluralization: İngilizce dilbilgisi kurallarına göre çoğul/tekil dönüşümü
 * 2. Case Conversion: PascalCase, camelCase, kebab-case, snake_case dönüşümleri
 * 3. Entity Naming: Controller, Service, DTO, Store gibi dosya/sınıf isimleri
 *
 * Pluralization Kuralları ve Edge Case'ler:
 * - Düzensiz çoğullar (person→people, child→children) sözlükle yönetilir
 * - Sayılamayan isimler (equipment, software, data) çoğullanmaz
 * - Latince/Yunanca kökenli kelimeler (analysis→analyses, matrix→matrices) desteklenir
 * - Kurallar en spesifikten en genele sıralanır (sıra önemli!)
 */

// ═══════════════════════════════════════
// Çoğullama Kuralları (Pluralization)
// ═══════════════════════════════════════

/**
 * Düzensiz çoğullar sözlüğü.
 * Standart İngilizce kurallara uymayan kelimeler burada tanımlanır.
 * Yeni bir düzensiz çoğul eklemek için buraya yeni bir satır eklenmesi yeterlidir.
 */
const IRREGULAR_PLURALS: Record<string, string> = {
  person: 'people',
  child: 'children',
  man: 'men',
  woman: 'women',
  mouse: 'mice',
  goose: 'geese',
  tooth: 'teeth',
  foot: 'feet',
  datum: 'data',
  index: 'indices',       // Latince kökenli
  matrix: 'matrices',     // Latince kökenli
  vertex: 'vertices',     // Latince kökenli
  analysis: 'analyses',   // Yunanca kökenli
  crisis: 'crises',       // Yunanca kökenli
  thesis: 'theses',       // Yunanca kökenli
};

/**
 * Düzensiz tekiller sözlüğü - çoğuldan tekile dönüşüm için.
 * IRREGULAR_PLURALS'dan otomatik olarak ters çevrilerek oluşturulur.
 */
const IRREGULAR_SINGULARS: Record<string, string> = {};
for (const [s, p] of Object.entries(IRREGULAR_PLURALS)) {
  IRREGULAR_SINGULARS[p] = s;
}

/**
 * Sayılamayan isimler kümesi.
 * Bu kelimeler çoğul yapılamaz - tekil ve çoğul halleri aynıdır.
 * 'data' hem burada hem IRREGULAR_PLURALS'da var çünkü farklı bağlamlarda
 * farklı kullanımları olabilir (datum→data vs data→data).
 */
const UNCOUNTABLE = new Set([
  'equipment', 'information', 'rice', 'money', 'species',
  'series', 'fish', 'sheep', 'deer', 'aircraft', 'software',
  'data', 'feedback', 'metadata', 'status',
]);

/**
 * İngilizce bir kelimeyi çoğul hale getirir.
 * Kurallar en spesifikten en genele sıralanmıştır - sıra DEĞİŞTİRİLMEMELİDİR.
 *
 * Kural öncelik sırası:
 * 1. Sayılamayan isimler → olduğu gibi döner
 * 2. Düzensiz çoğullar → sözlükten döner
 * 3. -sis ile bitenler → -ses (analysis → analyses)
 * 4. Sessiz+us ile bitenler → -i (stimulus → stimuli, sadece 4+ karakter)
 * 5. -fe ile bitenler → -ves (wife → wives)
 * 6. -f ile bitenler (ff hariç) → -ves (leaf → leaves, staff hariç)
 * 7. Sessiz+y ile bitenler → -ies (category → categories)
 * 8. s/x/z/ch/sh ile bitenler → +es (box → boxes)
 * 9. Sessiz+o ile bitenler → +es (hero → heroes)
 * 10. Genel kural → +s
 *
 * @param word - Çoğullanacak İngilizce kelime
 * @returns Kelimenin çoğul hali (küçük harf)
 */
export function toPlural(word: string): string {
  const lower = word.toLowerCase();

  // Sayılamayan isimler çoğullanmaz
  if (UNCOUNTABLE.has(lower)) return lower;
  // Düzensiz çoğullar sözlükten döner
  if (IRREGULAR_PLURALS[lower]) return IRREGULAR_PLURALS[lower];

  // Kurallar - sıra önemli, en spesifik olan önce kontrol edilir
  if (lower.endsWith('sis')) return lower.slice(0, -3) + 'ses';          // analysis → analyses (Yunanca köken)
  if (/[^aeiou]us$/i.test(lower) && lower.length > 4) return lower.slice(0, -2) + 'i'; // stimulus → stimuli (sadece uzun Latince kelimeler, 'bus' gibi kısa kelimeleri hariç tutar)
  if (lower.endsWith('fe')) return lower.slice(0, -2) + 'ves';           // wife → wives, knife → knives
  if (lower.endsWith('f') && !lower.endsWith('ff')) return lower.slice(0, -1) + 'ves'; // leaf → leaves (cliff→cliffs hariç, çünkü 'ff' ile biter)
  if (lower.endsWith('y') && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + 'ies'; // category → categories (monkey→monkeys hariç, çünkü sesli+y)
  if (/(s|x|z|ch|sh)$/i.test(lower)) return lower + 'es';               // box → boxes, church → churches, quiz → quizzes
  if (lower.endsWith('o') && !/[aeiou]o$/i.test(lower)) return lower + 'es'; // hero → heroes (zoo→zoos hariç, çünkü sesli+o)
  return lower + 's';  // Genel kural: çoğu kelime için basitçe 's' eklenir
}

/**
 * İngilizce bir kelimeyi tekil hale getirir.
 * Çoğullama kurallarının tersidir. Belirsiz durumlarda en yaygın kural uygulanır.
 *
 * @param word - Tekillenecek İngilizce kelime
 * @returns Kelimenin tekil hali (küçük harf)
 */
export function toSingular(word: string): string {
  const lower = word.toLowerCase();

  if (UNCOUNTABLE.has(lower)) return lower;
  if (IRREGULAR_SINGULARS[lower]) return IRREGULAR_SINGULARS[lower];

  // Ters çoğullama kuralları
  if (lower.endsWith('ies')) return lower.slice(0, -3) + 'y';         // categories → category
  if (lower.endsWith('ves')) return lower.slice(0, -3) + 'f';         // leaves → leaf
  if (lower.endsWith('ses') && lower.endsWith('sses')) return lower.slice(0, -2); // addresses → address
  if (lower.endsWith('xes') || lower.endsWith('zes') || lower.endsWith('shes') || lower.endsWith('ches')) return lower.slice(0, -2); // boxes → box
  if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1); // customers → customer (class→class hariç)
  return lower;
}

// ═══════════════════════════════════════
// Case Dönüşümleri
// ═══════════════════════════════════════

/**
 * Bir string'i kelimelere ayırır.
 * PascalCase, camelCase, snake_case ve kebab-case formatlarını tanır.
 *
 * Örnekler:
 *   "SaleOrder"  → ["Sale", "Order"]  (camelCase/PascalCase ayrımı)
 *   "sale_order" → ["sale", "order"]  (alt çizgi ile ayrılmış)
 *   "sale-order" → ["sale", "order"]  (tire ile ayrılmış)
 */
function splitWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase sınırlarında boşluk ekle
    .replace(/[_\-]+/g, ' ')               // alt çizgi ve tireleri boşluğa çevir
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** PascalCase dönüşümü: customer → Customer, sale_order → SaleOrder */
export function toPascalCase(str: string): string {
  return splitWords(str)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

/** camelCase dönüşümü: Customer → customer, SaleOrder → saleOrder */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/** kebab-case dönüşümü: SaleOrder → sale-order, Customer → customer (URL ve dosya adları için) */
export function toKebabCase(str: string): string {
  return splitWords(str)
    .map((w) => w.toLowerCase())
    .join('-');
}

/** snake_case dönüşümü: SaleOrder → sale_order, Customer → customer (veritabanı tablo/kolon adları için) */
export function toSnakeCase(str: string): string {
  return splitWords(str)
    .map((w) => w.toLowerCase())
    .join('_');
}

// ═══════════════════════════════════════
// Entity İsimlendirme Yardımcıları
// ═══════════════════════════════════════
// Bu fonksiyonlar, entity adından tutarlı sınıf ve dosya isimleri üretir.
// NestJS ve React konvansiyonlarına uygun isimlendirme sağlar.

/** Entity adından NestJS controller sınıf adı üretir: Customer → CustomersController */
export function toControllerName(entity: string): string {
  return toPascalCase(toPlural(entity)) + 'Controller';
}

/** Entity adından NestJS service sınıf adı üretir: Customer → CustomersService */
export function toServiceName(entity: string): string {
  return toPascalCase(toPlural(entity)) + 'Service';
}

/** Entity adından NestJS module sınıf adı üretir: Customer → CustomersModule */
export function toModuleName(entity: string): string {
  return toPascalCase(toPlural(entity)) + 'Module';
}

/** Entity adından Create DTO sınıf adı üretir: Customer → CreateCustomerDto */
export function toCreateDtoName(entity: string): string {
  return `Create${toPascalCase(entity)}Dto`;
}

/** Entity adından Update DTO sınıf adı üretir: Customer → UpdateCustomerDto */
export function toUpdateDtoName(entity: string): string {
  return `Update${toPascalCase(entity)}Dto`;
}

/** Entity adından NestJS controller dosya adı üretir: Customer → customers.controller.ts */
export function toControllerFileName(entity: string): string {
  return `${toKebabCase(toPlural(entity))}.controller.ts`;
}

/** Entity adından NestJS service dosya adı üretir: Customer → customers.service.ts */
export function toServiceFileName(entity: string): string {
  return `${toKebabCase(toPlural(entity))}.service.ts`;
}

/** Entity adından React/Zustand store hook adı üretir: Customer → useCustomerStore */
export function toStoreName(entity: string): string {
  return `use${toPascalCase(entity)}Store`;
}

/** Entity adından React sayfa bileşen adı üretir: Customer → CustomersPage */
export function toPageName(entity: string): string {
  return toPascalCase(toPlural(entity)) + 'Page';
}

/** Entity adından React form modal bileşen adı üretir: Customer → CustomerFormModal */
export function toFormModalName(entity: string): string {
  return toPascalCase(entity) + 'FormModal';
}

/**
 * Alan adını kullanıcıya gösterilecek etikete dönüştürür.
 * snake_case ve camelCase formatlarını destekler.
 * Örnek: "credit_limit" → "Credit Limit", "firstName" → "First Name"
 */
export function toLabel(fieldName: string): string {
  return splitWords(fieldName)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Entity adından RESTful API endpoint yolu üretir.
 * Çok kelimeli entity'lerde sadece son kelime çoğullanır ve kebab-case kullanılır.
 *
 * Örnekler:
 *   Customer  → /api/customers
 *   SaleOrder → /api/sale-orders  (sadece "order" çoğullanır)
 *
 * @param entity - Entity adı (PascalCase)
 * @returns API yolu (örn: "/api/customers")
 */
export function toApiPath(entity: string): string {
  // Önce kelimelere ayır, son kelimeyi çoğullaştır, kebab-case birleştir
  const words = entity
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .trim()
    .split(/\s+/);
  if (words.length > 0) {
    words[words.length - 1] = toPlural(words[words.length - 1]);
  }
  return `/api/${words.map((w) => w.toLowerCase()).join('-')}`;
}
