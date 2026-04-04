/**
 * FLYX Database Engine — Public API (Genel Arayüz)
 *
 * Bu dosya, database-engine paketinin dışarıya açık (public) API'sini tanımlar.
 * Paketin tüm modülleri buradan dışa aktarılır (re-export). Paket tüketicileri
 * (consumer) yalnızca bu dosya üzerinden erişim sağlar.
 *
 * Modül Yapısı:
 * ─────────────
 * 1. Şema Üretici (Schema Generator):
 *    - TableGenerator: FSL entity'lerinden CREATE TABLE ifadeleri üretir
 *    - mapFSLTypeToSQL: FSL tiplerini PostgreSQL tiplerine eşler
 *    - toSnakeCase: İsimleri snake_case formatına dönüştürür
 *    - formatDefault: Varsayılan değerleri SQL formatına çevirir
 *
 * 2. Migration Yöneticisi:
 *    - MigrationManager: Şema değişikliklerini migration dosyalarına dönüştürür
 *
 * 3. Sorgu Üretici (Query Builder):
 *    - QueryBuilder: Multi-tenant SQL sorguları üretir (SELECT, INSERT, UPDATE, DELETE)
 *
 * 4. CRUD Üretici:
 *    - CRUDGenerator: REST API endpoint tanımları ve parametreli SQL sorguları üretir
 *
 * Kullanım örneği:
 *   import { TableGenerator, QueryBuilder, CRUDGenerator } from '@flyx/database-engine';
 */

// Şema üretici: FSL entity → PostgreSQL CREATE TABLE
export { TableGenerator } from './schema-generator/table-generator.js';
export type { GeneratedSchema } from './schema-generator/table-generator.js';

// Tip eşleyici ve yardımcı fonksiyonlar
export { mapFSLTypeToSQL, toSnakeCase, formatDefault } from './schema-generator/type-mapper.js';

// Migration yöneticisi: Şema değişikliklerini yönetir (up/down SQL)
export { MigrationManager } from './migration/migration-manager.js';
export type { Migration } from './migration/migration-manager.js';

// Sorgu üretici: Multi-tenant SQL sorguları (tenant_id filtrelemeli)
export { QueryBuilder } from './query-builder/query-builder.js';
export type { QueryOptions } from './query-builder/query-builder.js';

// CRUD üretici: REST API operasyon tanımları ve parametreli SQL'ler
export { CRUDGenerator } from './crud-generator/crud-generator.js';
export type { CRUDOperation } from './crud-generator/crud-generator.js';
