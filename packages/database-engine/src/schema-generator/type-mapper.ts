/**
 * FSL → PostgreSQL Tip Eşleme Modülü
 *
 * Bu dosya, FLYX Schema Language (FSL) derleyicisinden gelen veri tiplerini
 * PostgreSQL veritabanı sütun tiplerine dönüştürür. Her FSL tipi için en uygun
 * PostgreSQL karşılığı seçilmiştir.
 *
 * Tip eşleme kararlarının gerekçeleri:
 * - Email/Phone/URL → VARCHAR(255): Bu alanlar yapısal olarak metin tabanlıdır.
 *   RFC 5321'e göre e-posta adresleri maksimum 254 karakter olabilir, bu yüzden
 *   VARCHAR(255) yeterli ve güvenli bir sınırdır. Telefon ve URL için de benzer mantık geçerlidir.
 * - File/Image → VARCHAR(500): Dosya/resim yolları veya URL'leri saklanır, gerçek dosya içeriği değil.
 *   Uzun CDN URL'lerini barındırmak için 500 karakter ayrılmıştır.
 * - JSON/Array → JSONB: PostgreSQL'in JSONB tipi, JSON verisini ikili (binary) formatta saklar.
 *   Bu sayede JSON üzerinde indeksleme ve sorgulama yapılabilir (GIN indeks desteği).
 * - Money → DECIMAL(15,2): Parasal değerler için kayan nokta (float) yerine sabit hassasiyetli
 *   DECIMAL kullanılır, böylece kuruş düzeyinde yuvarlama hataları önlenir.
 * - Relation → UUID: İlişkisel alanlar, referans verilen tablonun birincil anahtarını (UUID) tutar.
 *   Bu, foreign key (yabancı anahtar) ilişkilerinin temelini oluşturur.
 * - Enum → VARCHAR(100): Enum değerleri veritabanında metin olarak saklanır.
 *   PostgreSQL ENUM tipi yerine VARCHAR tercih edilmiştir çünkü şema değişiklikleri
 *   (yeni değer ekleme/çıkarma) migration olmadan daha kolay yönetilir.
 * - Computed → boş string: Hesaplanmış alanlar veritabanında saklanmaz, çalışma zamanında
 *   (runtime) hesaplanır.
 */
import type { DataType } from '@flyx/fsl-compiler';

/**
 * FSL veri tipini PostgreSQL sütun tipine eşler.
 *
 * @param dataType - FSL derleyicisinden gelen veri tipi AST düğümü
 * @returns PostgreSQL sütun tipi tanımı (örn: "VARCHAR(255)", "INTEGER", "JSONB")
 * @throws Bilinmeyen bir FSL tipi geldiğinde hata fırlatır
 */
export function mapFSLTypeToSQL(dataType: DataType): string {
  switch (dataType.name) {
    // Metin tipi: Varsayılan uzunluk 255, FSL'de String(100) gibi özelleştirilebilir
    case 'String': {
      const length = dataType.params?.[0] ?? 255;
      return `VARCHAR(${length})`;
    }
    // Tam sayı tipi: Küçük/büyük tam sayı ayrımı yapılmıyor, PostgreSQL INTEGER yeterli
    case 'Number':
      return 'INTEGER';
    // Ondalıklı sayı: Varsayılan hassasiyet 10 basamak, 2 ondalık (örn: 12345678.90)
    case 'Decimal': {
      const precision = dataType.params?.[0] ?? 10;
      const scale = dataType.params?.[1] ?? 2;
      return `DECIMAL(${precision},${scale})`;
    }
    // Boolean: PostgreSQL'in yerel BOOLEAN tipi kullanılır (TRUE/FALSE)
    case 'Boolean':
      return 'BOOLEAN';
    // Tarih: Sadece tarih bilgisi (yıl-ay-gün), saat bilgisi içermez
    case 'Date':
      return 'DATE';
    // Tarih ve saat: Tam zaman damgası (timestamp), saat dilimi bilgisi içermez
    case 'DateTime':
      return 'TIMESTAMP';
    // Email: RFC 5321 standardına göre maks. 254 karakter, 255 güvenli bir üst sınır
    // Phone: Uluslararası formatta (+90 532 XXX XX XX) en fazla ~20 karakter, 255 fazlasıyla yeterli
    // URL: Pratikte çoğu URL 255 karakterin altındadır, çok uzun URL'ler için Text tipi önerilir
    case 'Email':
    case 'Phone':
    case 'URL':
      return 'VARCHAR(255)';
    // Sınırsız metin: Uzun açıklama, biyografi gibi alanlar için PostgreSQL TEXT tipi
    case 'Text':
      return 'TEXT';
    // JSON verisi: JSONB formatı sayesinde JSON içeriği üzerinde sorgu ve indeksleme yapılabilir
    case 'JSON':
      return 'JSONB';
    // Para birimi: DECIMAL kullanılır, float/double KULLANILMAZ (yuvarlama hatası riski)
    // Varsayılan: 15 basamak hassasiyet, 2 ondalık → maks. 9,999,999,999,999.99
    case 'Money': {
      const precision = dataType.params?.[0] ?? 15;
      const scale = dataType.params?.[1] ?? 2;
      return `DECIMAL(${precision},${scale})`;
    }
    // Enum değerleri: VARCHAR(100) olarak saklanır, PostgreSQL ENUM tipi yerine tercih edilir
    // Böylece yeni enum değeri eklemek için ALTER TYPE gerekmez
    case 'Enum':
      return 'VARCHAR(100)';
    // İlişki (Relation): Referans verilen tablonun UUID birincil anahtarını tutar
    // Foreign key kısıtlaması TableGenerator tarafından ayrıca oluşturulur
    case 'Relation': {
      return 'UUID';
    }
    // Dosya/Resim: Gerçek dosya içeriği değil, dosyanın depolama yolu veya CDN URL'si saklanır
    // 500 karakter, uzun CDN URL'lerini (örn: S3 presigned URL) barındırmak için yeterlidir
    case 'File':
    case 'Image':
      return 'VARCHAR(500)';
    // Dizi tipi: PostgreSQL JSONB olarak saklanır, böylece farklı tiplerde dizi elemanları desteklenir
    case 'Array':
      return 'JSONB';
    // Hesaplanmış alan: Veritabanında fiziksel sütun oluşturulmaz, boş string döner
    // Bu alanlar uygulama katmanında (runtime) hesaplanır
    case 'Computed':
      return ''; // Computed fields are not stored
    default:
      throw new Error(`Unknown FSL type: ${dataType.name}`);
  }
}

/**
 * PascalCase veya camelCase isimleri snake_case formatına dönüştürür.
 *
 * PostgreSQL'de tablo ve sütun isimleri geleneksel olarak snake_case kullanır.
 * Örnek: "firstName" → "first_name", "OrderItem" → "order_item"
 *
 * @param name - Dönüştürülecek isim (PascalCase veya camelCase)
 * @returns snake_case formatında isim
 */
export function toSnakeCase(name: string): string {
  return name
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Varsayılan (default) değeri SQL formatına dönüştürür.
 *
 * FSL'de tanımlanan default değerleri SQL CREATE TABLE ifadesinde
 * kullanılabilecek formata çevirir.
 * Örnek: "aktif" → "'aktif'", true → "TRUE", 42 → "42"
 *
 * @param value - FSL'den gelen varsayılan değer
 * @returns SQL uyumlu varsayılan değer ifadesi
 */
export function formatDefault(value: string | number | boolean | unknown): string {
  if (typeof value === 'string') return `'${value}'`;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return String(value);
  return 'NULL';
}
