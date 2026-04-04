/**
 * REST CRUD Operasyon Üretici Modülü
 *
 * Bu dosya, FSL entity tanımlarından otomatik olarak REST API CRUD (Create, Read,
 * Update, Delete) operasyon tanımları üretir. Her entity için beş standart
 * endpoint oluşturulur:
 *
 * | HTTP Metodu | Yol                  | İşlem                      |
 * |-------------|----------------------|----------------------------|
 * | GET         | /{resource}          | Tüm kayıtları listele      |
 * | GET         | /{resource}/:id      | Tek kayıt getir            |
 * | POST        | /{resource}          | Yeni kayıt oluştur         |
 * | PUT         | /{resource}/:id      | Mevcut kaydı güncelle      |
 * | DELETE      | /{resource}/:id      | Kaydı sil                  |
 *
 * Multi-Tenant Güvenlik:
 * Tüm SQL sorgularında tenant_id parametresi ($1 veya $2) zorunlu olarak
 * kullanılır. Bu sayede bir kiracı (tenant) başka bir kiracının verilerine
 * erişemez, güncelleyemez veya silemez.
 *
 * Parametreli Sorgular:
 * SQL injection saldırılarına karşı koruma sağlamak için tüm değerler
 * $1, $2, $3... şeklinde parametreli (parameterized) olarak tanımlanır.
 * Bu parametreler çalışma zamanında güvenli bir şekilde bağlanır (bind).
 *
 * URL Yolu Dönüşümü:
 * Entity adı snake_case'e çevrilir, ardından alt çizgiler tire ile
 * değiştirilir: OrderItem → order_item → /order-item (RESTful URL kuralı)
 */
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toSnakeCase } from '../schema-generator/type-mapper.js';

/**
 * Tek bir CRUD operasyonunu temsil eden arayüz.
 *
 * Bu yapı, API gateway veya route tanımlayıcı tarafından kullanılarak
 * otomatik REST endpoint'leri oluşturulabilir.
 */
export interface CRUDOperation {
  name: string;                                    // Operasyon adı (örn: "list_order_item")
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';      // HTTP metodu
  path: string;                                     // URL yolu (örn: "/order-item/:id")
  sql: string;                                      // Çalıştırılacak parametreli SQL sorgusu
  description: string;                              // İnsan tarafından okunabilir açıklama
}

/**
 * FSL entity tanımlarından CRUD operasyon tanımları üreten sınıf.
 *
 * Kullanım:
 *   const generator = new CRUDGenerator();
 *   const operations = generator.generate(orderEntity);
 *   // operations → 5 adet CRUDOperation (list, get, create, update, delete)
 */
export class CRUDGenerator {
  /**
   * Bir FSL entity için beş standart CRUD operasyonu üretir.
   *
   * Her operasyon RESTful URL kurallarına uygun yol, HTTP metodu ve
   * parametreli SQL sorgusu içerir.
   *
   * @param entity - FSL entity AST düğümü
   * @returns Beş CRUD operasyonu dizisi
   */
  generate(entity: EntityDeclaration): CRUDOperation[] {
    const tableName = toSnakeCase(entity.name);
    // URL yolu: snake_case → kebab-case (örn: order_item → order-item)
    const resourceName = tableName.replace(/_/g, '-');

    return [
      // LİSTELE: Tüm kayıtları sayfalama ile getirir
      // $1 = tenant_id, $2 = limit, $3 = offset
      // created_at DESC: En yeni kayıtlar önce gösterilir
      {
        name: `list_${tableName}`,
        method: 'GET',
        path: `/${resourceName}`,
        sql: `SELECT * FROM ${tableName} WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;`,
        description: `List all ${entity.name} records`,
      },
      // GETİR: Tek bir kaydı ID ile getirir
      // $1 = id, $2 = tenant_id (çifte filtre: hem doğru kayıt hem doğru kiracı)
      {
        name: `get_${tableName}`,
        method: 'GET',
        path: `/${resourceName}/:id`,
        sql: `SELECT * FROM ${tableName} WHERE id = $1 AND tenant_id = $2;`,
        description: `Get a single ${entity.name} by ID`,
      },
      // OLUŞTUR: Yeni kayıt ekler
      // Computed alanlar hariç tüm entity alanları + tenant_id, created_at, created_by
      {
        name: `create_${tableName}`,
        method: 'POST',
        path: `/${resourceName}`,
        sql: this.generateInsertSQL(entity, tableName),
        description: `Create a new ${entity.name}`,
      },
      // GÜNCELLE: Mevcut kaydı günceller
      // updated_at ve updated_by otomatik set edilir (denetim izi)
      {
        name: `update_${tableName}`,
        method: 'PUT',
        path: `/${resourceName}/:id`,
        sql: this.generateUpdateSQL(entity, tableName),
        description: `Update an existing ${entity.name}`,
      },
      // SİL: Kaydı fiziksel olarak siler (hard delete)
      // $1 = id, $2 = tenant_id (multi-tenant güvenlik)
      {
        name: `delete_${tableName}`,
        method: 'DELETE',
        path: `/${resourceName}/:id`,
        sql: `DELETE FROM ${tableName} WHERE id = $1 AND tenant_id = $2;`,
        description: `Delete a ${entity.name} by ID`,
      },
    ];
  }

  /**
   * INSERT SQL sorgusu üretir (parametreli).
   *
   * İşlem sırası:
   * 1. Computed alanlar filtrelenir (veritabanında saklanmaz)
   * 2. Entity alanları sütun listesine eklenir
   * 3. Otomatik sütunlar eklenir: tenant_id, created_at, created_by
   * 4. Her sütun için $N parametresi oluşturulur
   * 5. RETURNING * ile eklenen kayıt (otomatik UUID id dahil) geri döndürülür
   *
   * @param entity - FSL entity AST düğümü
   * @param tableName - Hedef tablo adı (snake_case)
   * @returns Parametreli INSERT SQL ifadesi
   */
  private generateInsertSQL(entity: EntityDeclaration, tableName: string): string {
    // Computed alanlar hariç tutulur — veritabanında karşılıkları yoktur
    const fields = entity.fields.filter((f) => f.dataType.name !== 'Computed');
    const columns = fields.map((f) => toSnakeCase(f.name));
    // Denetim ve multi-tenant sütunları eklenir
    columns.push('tenant_id', 'created_at', 'created_by');

    // Parametreli yer tutucular: $1, $2, $3, ... (SQL injection koruması)
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *;`;
  }

  /**
   * UPDATE SQL sorgusu üretir (parametreli).
   *
   * İşlem sırası:
   * 1. Computed alanlar filtrelenir
   * 2. Her alan için SET ifadesi oluşturulur ($1, $2, ... parametreleri ile)
   * 3. updated_at = NOW() otomatik eklenir (denetim izi)
   * 4. updated_by parametresi eklenir
   * 5. WHERE koşulunda id VE tenant_id kullanılır (multi-tenant güvenlik)
   * 6. RETURNING * ile güncellenen kayıt geri döndürülür
   *
   * @param entity - FSL entity AST düğümü
   * @param tableName - Hedef tablo adı (snake_case)
   * @returns Parametreli UPDATE SQL ifadesi
   */
  private generateUpdateSQL(entity: EntityDeclaration, tableName: string): string {
    // Computed alanlar hariç tutulur
    const fields = entity.fields.filter((f) => f.dataType.name !== 'Computed');
    const setParts = fields.map((f, i) => `${toSnakeCase(f.name)} = $${i + 1}`);
    const nextIdx = fields.length + 1;
    // Denetim sütunları: güncelleme zamanı ve güncelleyen kullanıcı
    setParts.push(`updated_at = NOW()`);
    setParts.push(`updated_by = $${nextIdx}`);

    // Multi-tenant güvenlik: id VE tenant_id ile filtreleme
    return `UPDATE ${tableName} SET ${setParts.join(', ')} WHERE id = $${nextIdx + 1} AND tenant_id = $${nextIdx + 2} RETURNING *;`;
  }
}
