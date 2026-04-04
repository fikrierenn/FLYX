/**
 * Veritabanı Migration (Göç) Yönetim Modülü
 *
 * Bu dosya, FSL şema değişikliklerini PostgreSQL migration dosyalarına dönüştürür.
 * Migration sistemi, veritabanı şemasının sürüm kontrolünü sağlar ve şema
 * değişikliklerinin güvenli bir şekilde uygulanmasını (up) ve geri alınmasını (down)
 * mümkün kılar.
 *
 * Her migration şunları içerir:
 * - id: Zaman damgası + işlem açıklaması (örn: "1712345678_create_order_item")
 *   Bu format, migration'ların kronolojik sırada çalışmasını garanti eder.
 * - upSQL: Şema değişikliğini uygulayan SQL (ileri yönde göç)
 * - downSQL: Şema değişikliğini geri alan SQL (geri yönde göç)
 *   CASCADE kullanılır çünkü bağımlı nesneler (indeksler, foreign key'ler)
 *   de otomatik olarak temizlenmelidir.
 *
 * Desteklenen migration işlemleri:
 * - Tablo oluşturma (CREATE TABLE + indeksler + foreign key'ler)
 * - Sütun ekleme (ALTER TABLE ADD COLUMN)
 * - Sütun silme (ALTER TABLE DROP COLUMN)
 */
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { TableGenerator } from '../schema-generator/table-generator.js';

/**
 * Tek bir migration kaydını temsil eden arayüz.
 *
 * upSQL ve downSQL birbirinin tersi işlemleri içerir:
 * up → CREATE TABLE ... / down → DROP TABLE ... CASCADE
 * up → ADD COLUMN ... / down → DROP COLUMN ...
 */
export interface Migration {
  id: string;          // Benzersiz migration kimliği (zaman damgası + açıklama)
  timestamp: number;   // Oluşturma zamanı (milisaniye cinsinden Unix epoch)
  description: string; // İnsan tarafından okunabilir açıklama
  upSQL: string;       // İleri yönde göç SQL'i (şemayı günceller)
  downSQL: string;     // Geri yönde göç SQL'i (şemayı eski haline getirir)
}

/**
 * Veritabanı şema migration'larını yöneten sınıf.
 *
 * Mevcut ve hedef entity tanımlarını karşılaştırarak gerekli SQL
 * migration ifadelerini üretir. TableGenerator'ı kullanarak CREATE TABLE
 * ifadelerini oluşturur.
 */
export class MigrationManager {
  /** Tablo SQL üretimi için TableGenerator örneği */
  private tableGenerator = new TableGenerator();

  /**
   * Yeni bir entity tablosu oluşturmak için migration üretir.
   *
   * Üretilen migration şunları içerir:
   * - upSQL: CREATE TABLE + CREATE INDEX + ALTER TABLE (foreign key'ler)
   * - downSQL: DROP TABLE ... CASCADE (tablo ve tüm bağımlılıkları siler)
   *
   * Migration ID formatı: {timestamp}_create_{tablo_adı}
   * Örnek: "1712345678000_create_order_item"
   *
   * @param entity - FSL entity AST düğümü
   * @returns Oluşturma migration nesnesi
   */
  generateCreateMigration(entity: EntityDeclaration): Migration {
    const schema = this.tableGenerator.generateSchema(entity);
    const timestamp = Date.now();

    return {
      id: `${timestamp}_create_${schema.tableName}`,
      timestamp,
      description: `Create table ${schema.tableName}`,
      upSQL: this.tableGenerator.generateFullSQL(entity),
      // CASCADE: Tabloya bağlı indeksler, foreign key'ler ve view'lar da silinir
      downSQL: `DROP TABLE IF EXISTS ${schema.tableName} CASCADE;`,
    };
  }

  /**
   * Mevcut bir tabloya yeni sütun eklemek için ALTER TABLE SQL'i üretir.
   *
   * @param tableName - Hedef tablo adı (snake_case formatında)
   * @param columnDef - Sütun tanımı (örn: "email VARCHAR(255) NOT NULL")
   * @returns ALTER TABLE ADD COLUMN SQL ifadesi
   */
  generateAddColumnSQL(tableName: string, columnDef: string): string {
    return `ALTER TABLE ${tableName} ADD COLUMN ${columnDef};`;
  }

  /**
   * Mevcut bir tablodan sütun silmek için ALTER TABLE SQL'i üretir.
   *
   * IF EXISTS kullanılır çünkü sütun zaten silinmiş olabilir
   * (idempotent migration desteği).
   *
   * @param tableName - Hedef tablo adı (snake_case formatında)
   * @param columnName - Silinecek sütun adı
   * @returns ALTER TABLE DROP COLUMN SQL ifadesi
   */
  generateDropColumnSQL(tableName: string, columnName: string): string {
    return `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName};`;
  }
}
