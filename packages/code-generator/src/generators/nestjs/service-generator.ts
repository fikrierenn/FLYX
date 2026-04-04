/**
 * FLYX NestJS Service Üretici
 * ============================
 * FSL entity tanımından NestJS service (iş mantığı) katmanı kodu üretir.
 *
 * Üretilen service özellikleri:
 * - @Injectable() dekoratörü ile NestJS DI (Dependency Injection) desteği
 * - CRUD operasyonları: findAll, findOne, create, update, remove
 * - Sayfalama mantığı (page/limit ile offset hesaplaması)
 * - snake_case tablo adı (veritabanı konvansiyonuna uygun)
 * - NotFoundException ile kayıt bulunamadı hatası (şablon olarak)
 *
 * Önemli: Üretilen kod TODO işaretleri içerir. Veritabanı bağlantısı
 * ve sorgu çalıştırma kısımları projeye özel olarak doldurulmalıdır.
 * Bu tasarım kararı, ORM bağımsızlığı sağlamak içindir (TypeORM, Prisma,
 * Drizzle veya doğrudan SQL kullanılabilir).
 */

import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toPlural, toSnakeCase } from '../../core/naming/index.js';

/**
 * NestJS Service üretici sınıfı.
 * Entity tanımını alır ve veritabanı işlemleri için iskelet service kodu üretir.
 */
export class NestJSServiceGenerator {
  /**
   * Verilen entity için NestJS service kodu üretir.
   *
   * @param entity - FSL entity tanımı
   * @returns Üretilen service TypeScript kaynak kodu
   */
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);
    // Veritabanı tablo adı snake_case konvansiyonunda (Customer → customer)
    const tableName = toSnakeCase(name);
    const createDto = `Create${name}Dto`;
    const updateDto = `Update${name}Dto`;

    return `import { Injectable, NotFoundException } from '@nestjs/common';
import { ${createDto} } from './dto/create-${name.toLowerCase()}.dto';
import { ${updateDto} } from './dto/update-${name.toLowerCase()}.dto';

@Injectable()
export class ${name}sService {
  // TODO: Inject database connection
  private readonly tableName = '${tableName}';

  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    // TODO: Execute query
    return { data: [], total: 0, page, limit };
  }

  async findOne(id: string) {
    // TODO: Execute query
    // if (!result) throw new NotFoundException(\`${name} \${id} not found\`);
    return { id };
  }

  async create(dto: ${createDto}) {
    // TODO: Execute insert
    return { id: crypto.randomUUID(), ...dto };
  }

  async update(id: string, dto: ${updateDto}) {
    // TODO: Execute update
    return { id, ...dto };
  }

  async remove(id: string) {
    // TODO: Execute delete
    return { id, deleted: true };
  }
}`;
  }
}
