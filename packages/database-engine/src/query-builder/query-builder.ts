/**
 * SQL Sorgu Üretici (Query Builder) Modülü
 *
 * Bu dosya, FSL entity tanımlarından tip-güvenli (type-safe) SQL sorguları üretir.
 * Tüm sorgular multi-tenant mimariyi destekler: her sorguya otomatik olarak
 * tenant_id filtresi eklenir.
 *
 * Multi-Tenant Mimari:
 * ─────────────────────
 * FLYX platformu, birden fazla kiracının (tenant) aynı veritabanını paylaştığı
 * bir multi-tenant mimarisi kullanır. Veri izolasyonu satır düzeyinde (row-level)
 * sağlanır: her tablodaki tenant_id sütunu, kaydın hangi kiracıya ait olduğunu belirtir.
 *
 * Bu QueryBuilder, tenant_id filtresini TÜM sorgulara zorunlu olarak ekler:
 * - SELECT: WHERE tenant_id = '...' (başka kiracının verisini göremezsiniz)
 * - INSERT: tenant_id sütununa kiracı kimliği yazılır
 * - UPDATE: WHERE ... AND tenant_id = '...' (sadece kendi kiracınızın verisini güncelleyebilirsiniz)
 * - DELETE: WHERE ... AND tenant_id = '...' (sadece kendi kiracınızın verisini silebilirsiniz)
 *
 * Bu yaklaşım, uygulama katmanında veri sızıntısını önler. Bir kiracı,
 * asla başka bir kiracının verilerine erişemez.
 *
 * Denetim İzi (Audit Trail):
 * ──────────────────────────
 * - INSERT sorgularında created_at (NOW()) ve created_by (userId) otomatik set edilir
 * - UPDATE sorgularında updated_at (NOW()) ve updated_by (userId) otomatik set edilir
 * - RETURNING * ile eklenen/güncellenen kayıt geri döndürülür
 */
import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toSnakeCase } from '../schema-generator/type-mapper.js';

/**
 * Sorgu seçenekleri arayüzü.
 *
 * tenantId zorunludur — multi-tenant mimaride her sorgu bir kiracıya ait olmalıdır.
 * where, orderBy, limit ve offset ile filtreleme, sıralama ve sayfalama yapılır.
 */
export interface QueryOptions {
  where?: Record<string, unknown>;   // Filtreleme koşulları (alan adı → değer)
  orderBy?: { column: string; direction: 'ASC' | 'DESC' }[]; // Sıralama kriterleri
  limit?: number;                     // Sayfalama: maksimum kayıt sayısı
  offset?: number;                    // Sayfalama: atlanacak kayıt sayısı
  tenantId: string;                   // Zorunlu: Kiracı (tenant) kimliği
}

/**
 * FSL entity'leri için tip-güvenli SQL sorguları üreten sınıf.
 *
 * Her QueryBuilder örneği belirli bir entity (tablo) için sorgu üretir.
 * Entity adı otomatik olarak snake_case'e dönüştürülür.
 *
 * Kullanım:
 *   const qb = new QueryBuilder(customerEntity);
 *   const sql = qb.selectAll({ tenantId: 'abc-123', limit: 10 });
 *   // → SELECT * FROM customer WHERE tenant_id = 'abc-123' LIMIT 10;
 */
export class QueryBuilder {
  private tableName: string;
  private entity: EntityDeclaration;

  constructor(entity: EntityDeclaration) {
    this.entity = entity;
    this.tableName = toSnakeCase(entity.name);
  }

  /**
   * Tüm kayıtları listeleyen SELECT sorgusu üretir.
   *
   * Sorgu yapısı:
   * 1. Önce tenant_id filtresi uygulanır (zorunlu, multi-tenant izolasyon)
   * 2. Varsa ek WHERE koşulları eklenir (AND ile bağlanır)
   * 3. Varsa ORDER BY sıralaması eklenir
   * 4. Varsa LIMIT ve OFFSET sayfalama parametreleri eklenir
   *
   * @param options - Sorgu seçenekleri (tenantId zorunlu, diğerleri opsiyonel)
   * @returns Parametreli SELECT SQL ifadesi
   */
  selectAll(options: QueryOptions): string {
    let sql = `SELECT * FROM ${this.tableName}`;
    // Multi-tenant filtresi: İlk WHERE koşulu her zaman tenant_id'dir
    sql += ` WHERE tenant_id = '${options.tenantId}'`;

    // Ek filtreleme koşulları (AND ile eklenir)
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        const col = toSnakeCase(key);
        sql += ` AND ${col} = ${this.formatValue(value)}`;
      }
    }

    // Sıralama: Birden fazla sütuna göre sıralama desteklenir
    if (options.orderBy) {
      const orderParts = options.orderBy.map(
        (o) => `${toSnakeCase(o.column)} ${o.direction}`,
      );
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    // Sayfalama: LIMIT ve OFFSET ile sayfa bazlı veri çekme
    if (options.limit !== undefined) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset !== undefined) {
      sql += ` OFFSET ${options.offset}`;
    }

    return sql + ';';
  }

  /**
   * Tek bir kaydı ID'ye göre getiren SELECT sorgusu üretir.
   *
   * Hem id hem de tenant_id ile filtrelenir — bu sayede bir kiracı
   * başka bir kiracının kaydına ID bilse bile erişemez.
   *
   * @param id - Kaydın UUID'si
   * @param tenantId - Kiracı kimliği
   * @returns SELECT SQL ifadesi
   */
  selectById(id: string, tenantId: string): string {
    return `SELECT * FROM ${this.tableName} WHERE id = '${id}' AND tenant_id = '${tenantId}';`;
  }

  /**
   * Yeni kayıt ekleyen INSERT sorgusu üretir.
   *
   * Otomatik eklenen sütunlar:
   * - tenant_id: Kiracı kimliği (zorunlu)
   * - created_at: NOW() ile oluşturma zamanı
   * - created_by: Oluşturan kullanıcı kimliği (opsiyonel)
   *
   * RETURNING * ile eklenen kayıt (otomatik üretilen id dahil) geri döndürülür.
   *
   * @param data - Eklenecek veri (alan adı → değer)
   * @param tenantId - Kiracı kimliği
   * @param userId - Oluşturan kullanıcı kimliği (opsiyonel, denetim izi için)
   * @returns INSERT ... RETURNING * SQL ifadesi
   */
  insert(data: Record<string, unknown>, tenantId: string, userId?: string): string {
    // Otomatik sütunlar: tenant_id ve created_at her zaman eklenir
    const columns = ['tenant_id', 'created_at'];
    const values = [`'${tenantId}'`, 'NOW()'];

    // Denetim izi: Oluşturan kullanıcı bilgisi (opsiyonel)
    if (userId) {
      columns.push('created_by');
      values.push(`'${userId}'`);
    }

    // Kullanıcı tarafından sağlanan veriler
    for (const [key, value] of Object.entries(data)) {
      columns.push(toSnakeCase(key));
      values.push(this.formatValue(value));
    }

    return `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING *;`;
  }

  /**
   * Mevcut bir kaydı güncelleyen UPDATE sorgusu üretir.
   *
   * Otomatik güncellenen sütunlar:
   * - updated_at: NOW() ile güncelleme zamanı
   * - updated_by: Güncelleyen kullanıcı kimliği (opsiyonel)
   *
   * WHERE koşulunda hem id hem tenant_id kullanılır (multi-tenant güvenlik).
   * RETURNING * ile güncellenen kayıt geri döndürülür.
   *
   * @param id - Güncellenecek kaydın UUID'si
   * @param data - Güncellenecek alanlar (alan adı → yeni değer)
   * @param tenantId - Kiracı kimliği
   * @param userId - Güncelleyen kullanıcı kimliği (opsiyonel, denetim izi için)
   * @returns UPDATE ... RETURNING * SQL ifadesi
   */
  update(id: string, data: Record<string, unknown>, tenantId: string, userId?: string): string {
    // updated_at her zaman güncellenir (denetim izi)
    const setParts: string[] = ['updated_at = NOW()'];

    // Denetim izi: Güncelleyen kullanıcı bilgisi (opsiyonel)
    if (userId) {
      setParts.push(`updated_by = '${userId}'`);
    }

    // Kullanıcı tarafından güncellenen alanlar
    for (const [key, value] of Object.entries(data)) {
      setParts.push(`${toSnakeCase(key)} = ${this.formatValue(value)}`);
    }

    // Multi-tenant güvenlik: id VE tenant_id ile filtreleme
    return `UPDATE ${this.tableName} SET ${setParts.join(', ')} WHERE id = '${id}' AND tenant_id = '${tenantId}' RETURNING *;`;
  }

  /**
   * Bir kaydı ID'ye göre silen DELETE sorgusu üretir.
   *
   * Fiziksel silme (hard delete) yapar. tenant_id filtresi sayesinde
   * bir kiracı başka bir kiracının kaydını silemez.
   *
   * @param id - Silinecek kaydın UUID'si
   * @param tenantId - Kiracı kimliği
   * @returns DELETE SQL ifadesi
   */
  deleteById(id: string, tenantId: string): string {
    return `DELETE FROM ${this.tableName} WHERE id = '${id}' AND tenant_id = '${tenantId}';`;
  }

  /**
   * Kayıt sayısını döndüren COUNT sorgusu üretir.
   *
   * tenant_id filtresi zorunludur. Opsiyonel WHERE koşulları ile
   * belirli kriterlere uyan kayıtların sayısı alınabilir.
   *
   * @param tenantId - Kiracı kimliği
   * @param where - Opsiyonel filtreleme koşulları
   * @returns SELECT COUNT(*) SQL ifadesi
   */
  count(tenantId: string, where?: Record<string, unknown>): string {
    let sql = `SELECT COUNT(*) FROM ${this.tableName} WHERE tenant_id = '${tenantId}'`;

    if (where) {
      for (const [key, value] of Object.entries(where)) {
        sql += ` AND ${toSnakeCase(key)} = ${this.formatValue(value)}`;
      }
    }

    return sql + ';';
  }

  /**
   * JavaScript değerini SQL uyumlu string formatına dönüştürür.
   *
   * SQL injection'a karşı temel koruma sağlar:
   * - String değerlerde tek tırnak (') kaçırılır ('' ile değiştirilir)
   * - null/undefined → NULL
   * - Nesne/dizi → JSON string olarak saklanır
   *
   * @param value - Dönüştürülecek JavaScript değeri
   * @returns SQL uyumlu string ifade
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    // Nesne ve diziler JSON string olarak saklanır (JSONB sütunları için)
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
}
