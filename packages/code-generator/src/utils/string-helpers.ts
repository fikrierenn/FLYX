/**
 * FLYX String Yardımcıları (v1 Uyumlu)
 * ======================================
 * Bu dosya, kod üretiminde kullanılan temel string dönüşüm fonksiyonlarını
 * içerir. V1 API uyumluluğu için korunmaktadır.
 *
 * NOT: Daha kapsamlı isimlendirme fonksiyonları için core/naming modülünü
 * kullanın. Bu dosyadaki fonksiyonlar eski import'lar için geriye dönük
 * uyumluluğu sağlamak amacıyla tutulmaktadır.
 *
 * core/naming modülündeki farklar:
 * - Daha kapsamlı pluralization kuralları (düzensiz çoğullar, sayılamayanlar)
 * - splitWords() ile daha doğru kelime ayrımı
 * - Entity isimlendirme yardımcıları (controller, service, DTO adları)
 */

/**
 * String'i PascalCase formatına dönüştürür.
 * Alt çizgi ve tireden sonraki harfleri büyütür, ilk harfi de büyütür.
 * Örnek: "customer_name" → "CustomerName", "sale-order" → "SaleOrder"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/(^|[_-])([a-z])/g, (_, _sep, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase());
}

/**
 * String'i camelCase formatına dönüştürür.
 * PascalCase'in ilk harfi küçültülmüş halidir.
 * Örnek: "CustomerName" → "customerName", "sale_order" → "saleOrder"
 */
export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * String'i kebab-case formatına dönüştürür.
 * Büyük harflerin önüne tire ekler ve tamamını küçültür.
 * Dosya adları ve URL yolları için kullanılır.
 * Örnek: "SaleOrder" → "sale-order", "CustomerName" → "customer-name"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * String'i snake_case formatına dönüştürür.
 * Büyük harflerin önüne alt çizgi ekler ve tamamını küçültür.
 * Veritabanı tablo ve kolon adları için kullanılır.
 * Örnek: "SaleOrder" → "sale_order", "CustomerName" → "customer_name"
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Basit İngilizce çoğullama fonksiyonu (v1 uyumlu).
 *
 * DİKKAT: Bu basitleştirilmiş bir versiyondur. Sadece temel kuralları uygular:
 * - s/x/z ile bitenler → +es (box → boxes)
 * - Sessiz+y ile bitenler → -y+ies (category → categories)
 * - Diğer → +s
 *
 * Düzensiz çoğullar (person→people) ve sayılamayan isimler (data, software)
 * desteklenmez. Tam kapsamlı çoğullama için core/naming/toPlural kullanın.
 */
export function toPlural(str: string): string {
  const lower = str.toLowerCase();
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z')) return lower + 'es';
  if (lower.endsWith('y') && !/[aeiou]y$/i.test(lower)) return lower.slice(0, -1) + 'ies';
  return lower + 's';
}

/**
 * Alan adını kullanıcıya gösterilecek etikete dönüştürür.
 * Alt çizgileri boşluğa çevirir, camelCase sınırlarını ayırır,
 * ilk harfi büyütür.
 * Örnek: "credit_limit" → "Credit Limit", "firstName" → "First Name"
 */
export function fieldLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
