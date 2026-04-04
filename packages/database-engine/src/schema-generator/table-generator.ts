/**
 * PostgreSQL CREATE TABLE Üretici Modülü
 *
 * Bu dosya, FSL EntityDeclaration AST düğümlerinden PostgreSQL CREATE TABLE
 * ifadeleri üretir. Her entity (varlık) için şunları otomatik oluşturur:
 *
 * 1. CREATE TABLE ifadesi (tüm sütunlar, kısıtlamalar ve varsayılan değerlerle)
 * 2. İndeks tanımları (indexed kısıtlaması olan alanlar için)
 * 3. Foreign key (yabancı anahtar) kısıtlamaları (Relation tipli alanlar için)
 *
 * Otomatik oluşturulan sütunlar:
 * - id: UUID tipinde birincil anahtar, gen_random_uuid() ile otomatik üretilir.
 *   Sıralı (sequential) INT yerine UUID kullanılmasının nedeni: dağıtık sistemlerde
 *   çakışma riski olmaması ve tahmin edilememesi (güvenlik).
 * - created_at: Kaydın oluşturulma zamanı, NOW() ile otomatik set edilir.
 * - created_by: Kaydı oluşturan kullanıcının UUID'si (denetim izi / audit trail için).
 * - updated_at: Son güncelleme zamanı (uygulama katmanında set edilir).
 * - updated_by: Son güncelleyen kullanıcının UUID'si.
 * - tenant_id: Multi-tenant mimari için kiracı (tenant) kimliği. NOT NULL zorunludur
 *   çünkü her kayıt mutlaka bir kiracıya ait olmalıdır. Bu sütun, veri izolasyonunun
 *   temelini oluşturur.
 *
 * Foreign Key Üretimi:
 * Relation tipli her alan için, referans verilen tablonun id sütununa işaret eden
 * bir yabancı anahtar kısıtlaması oluşturulur. Kısıtlama isimlendirmesi:
 * fk_{tablo_adı}_{sütun_adı} formatındadır.
 * Örnek: Relation(Customer) → fk_order_customer_id FOREIGN KEY (customer_id) REFERENCES customer(id)
 */
import type { EntityDeclaration, FieldDeclaration } from '@flyx/fsl-compiler';
import { mapFSLTypeToSQL, toSnakeCase, formatDefault } from './type-mapper.js';

/**
 * Üretilen şema bilgilerini tutan arayüz.
 * Tablo SQL'i, indeksler ve yabancı anahtarlar ayrı ayrı tutulur
 * böylece migration sistemi bunları bağımsız olarak yönetebilir.
 */
export interface GeneratedSchema {
  tableName: string;
  createTableSQL: string;
  indexes: string[];
  foreignKeys: string[];
}

/**
 * FSL EntityDeclaration AST düğümlerinden PostgreSQL CREATE TABLE ifadeleri üreten sınıf.
 *
 * Kullanım:
 *   const generator = new TableGenerator();
 *   const schema = generator.generateSchema(entityAST);
 *   // schema.createTableSQL → CREATE TABLE ifadesi
 *   // schema.indexes → CREATE INDEX ifadeleri
 *   // schema.foreignKeys → ALTER TABLE ... ADD CONSTRAINT ifadeleri
 */
export class TableGenerator {
  /**
   * Bir FSL entity tanımından tam bir PostgreSQL şeması üretir.
   *
   * İşlem sırası:
   * 1. Entity adı snake_case'e dönüştürülür (örn: OrderItem → order_item)
   * 2. Otomatik UUID birincil anahtar eklenir
   * 3. Entity'nin her alanı PostgreSQL sütununa dönüştürülür
   * 4. İndekslenmiş alanlar için CREATE INDEX ifadeleri toplanır
   * 5. Relation alanları için foreign key kısıtlamaları toplanır
   * 6. Denetim (audit) sütunları ve tenant_id eklenir
   *
   * @param entity - FSL derleyicisinden gelen entity AST düğümü
   * @returns Tablo SQL'i, indeksler ve yabancı anahtarları içeren şema nesnesi
   */
  generateSchema(entity: EntityDeclaration): GeneratedSchema {
    const tableName = toSnakeCase(entity.name);
    const indexes: string[] = [];
    const foreignKeys: string[] = [];

    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

    // Otomatik UUID birincil anahtar: gen_random_uuid() PostgreSQL 13+ yerleşik fonksiyonudur.
    // Harici eklenti (uuid-ossp) gerektirmez. UUID v4 formatında rastgele değer üretir.
    sql += '  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n';

    // Entity'nin FSL'de tanımlanan alanlarını PostgreSQL sütunlarına dönüştür
    for (const field of entity.fields) {
      const colSQL = this.generateColumn(field);
      if (!colSQL) continue; // Hesaplanmış (Computed) alanlar atlanır, veritabanında saklanmaz

      sql += `  ${colSQL},\n`;

      // İndeks toplama: FSL'de "indexed" kısıtlaması olan alanlar için
      // B-tree indeksi oluşturulur. Bu, WHERE ve ORDER BY sorgularını hızlandırır.
      if (field.constraints?.indexed) {
        indexes.push(
          `CREATE INDEX IF NOT EXISTS idx_${tableName}_${toSnakeCase(field.name)} ON ${tableName}(${toSnakeCase(field.name)});`,
        );
      }

      // Yabancı anahtar (Foreign Key) toplama: Relation tipli alanlar için
      // referans verilen tablonun id sütununa işaret eden kısıtlama oluşturulur.
      // Örnek: Relation(Customer) → customer tablosunun id sütununa referans
      if (field.dataType.name === 'Relation' && field.dataType.params?.[0]) {
        const refTable = toSnakeCase(String(field.dataType.params[0]));
        const colName = toSnakeCase(field.name);
        foreignKeys.push(
          `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_${colName} FOREIGN KEY (${colName}) REFERENCES ${refTable}(id);`,
        );
      }
    }

    // Denetim (audit) sütunları: Her tabloya otomatik eklenir.
    // Bu sütunlar kimin ne zaman kayıt oluşturduğunu/güncellediğini takip eder.
    sql += '  created_at TIMESTAMP DEFAULT NOW(),\n';  // Oluşturma zamanı (otomatik)
    sql += '  created_by UUID,\n';                      // Oluşturan kullanıcı kimliği
    sql += '  updated_at TIMESTAMP,\n';                 // Son güncelleme zamanı
    sql += '  updated_by UUID,\n';                      // Son güncelleyen kullanıcı kimliği
    // Multi-tenant kiracı kimliği: NOT NULL zorunludur çünkü her kayıt
    // mutlaka bir kiracıya (tenant) ait olmalıdır. Bu, veri izolasyonunun temelidir.
    sql += '  tenant_id UUID NOT NULL\n';
    sql += ');';

    return {
      tableName,
      createTableSQL: sql,
      indexes,
      foreignKeys,
    };
  }

  /**
   * Tek bir FSL alan tanımını PostgreSQL sütun tanımına dönüştürür.
   *
   * Üretilen sütun tanımı şu bileşenleri içerebilir:
   * - Sütun adı (snake_case formatında)
   * - Veri tipi (type-mapper.ts tarafından eşlenen PostgreSQL tipi)
   * - NOT NULL kısıtlaması (FSL'de "required" olarak işaretlenmişse)
   * - UNIQUE kısıtlaması (FSL'de "unique" olarak işaretlenmişse)
   * - DEFAULT değeri (FSL'de varsayılan değer tanımlanmışsa)
   *
   * @param field - FSL alan tanımı AST düğümü
   * @returns PostgreSQL sütun tanımı string'i veya Computed alan ise null
   */
  private generateColumn(field: FieldDeclaration): string | null {
    const colName = toSnakeCase(field.name);
    const colType = mapFSLTypeToSQL(field.dataType);

    // Hesaplanmış (Computed) alanlar veritabanında saklanmaz, null döndürülür
    if (!colType) return null;

    let col = `${colName} ${colType}`;

    // Kısıtlamalar (constraints) ekleniyor
    if (field.constraints?.required) col += ' NOT NULL';
    if (field.constraints?.unique) col += ' UNIQUE';
    if (field.constraints?.default !== undefined) {
      col += ` DEFAULT ${formatDefault(field.constraints.default)}`;
    }

    return col;
  }

  /**
   * Bir entity için tablo, indeksler ve yabancı anahtarlar dahil tam SQL üretir.
   *
   * Bu metot, generateSchema() tarafından üretilen tüm SQL parçalarını
   * tek bir string olarak birleştirir. Migration dosyası oluşturmak için idealdir.
   *
   * @param entity - FSL entity AST düğümü
   * @returns Tam SQL ifadesi (CREATE TABLE + CREATE INDEX + ALTER TABLE)
   */
  generateFullSQL(entity: EntityDeclaration): string {
    const schema = this.generateSchema(entity);
    const parts = [schema.createTableSQL];

    if (schema.indexes.length > 0) {
      parts.push('');
      parts.push(...schema.indexes);
    }

    if (schema.foreignKeys.length > 0) {
      parts.push('');
      parts.push(...schema.foreignKeys);
    }

    return parts.join('\n');
  }
}
