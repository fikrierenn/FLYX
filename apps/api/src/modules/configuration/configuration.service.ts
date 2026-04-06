/**
 * Configuration Service
 * =======================
 * Tum FSL nesnelerini DB'de yonetir.
 * 1C'deki Configuration DB'sine karsilik gelir.
 * Disk'te FSL dosyasi YOK - her sey bu tabloda.
 */

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';
import { FSLCompiler } from '@flyx/fsl-compiler';

const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001';

export interface ConfigObject {
  id: string;
  object_type: string;
  name: string;
  module: string;
  fsl_code: string;
  compiled_ast: any;
  metadata: any;
  version: number;
  is_active: boolean;
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger('ConfigurationService');
  private readonly compiler = new FSLCompiler();

  constructor(private readonly db: DatabaseService) {}

  /** Migration calistir (tablo olustur) */
  async runMigrations(): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    const migrationPaths = [
      path.resolve(process.cwd(), 'migrations', '001_configuration_objects.sql'),
      path.resolve(process.cwd(), '..', '..', 'apps', 'api', 'migrations', '001_configuration_objects.sql'),
      path.resolve(process.cwd(), '..', 'api', 'migrations', '001_configuration_objects.sql'),
    ];

    for (const p of migrationPaths) {
      if (fs.existsSync(p)) {
        const sql = fs.readFileSync(p, 'utf-8');
        await this.db.query(sql);
        this.logger.log('Configuration tablolari olusturuldu');
        return;
      }
    }
    this.logger.warn('Migration dosyasi bulunamadi');
  }

  // ============================================================
  // CRUD
  // ============================================================

  /** Yeni nesne olustur (FSL kodu ile) */
  async create(data: {
    object_type: string;
    name: string;
    module?: string;
    fsl_code: string;
    tenant_id?: string;
  }): Promise<ConfigObject> {
    const tenantId = data.tenant_id || DEFAULT_TENANT;

    // FSL derle
    let compiledAst: any = null;
    let metadata: any = {};
    try {
      const result = this.compiler.compile(data.fsl_code);
      compiledAst = result.ast[0];
      metadata = {
        fieldCount: compiledAst?.fields?.length || 0,
        hasMethods: !!compiledAst?.methods?.length,
        hasTriggers: !!compiledAst?.triggers?.triggers?.length,
        hasPermissions: !!compiledAst?.permissions,
      };
    } catch (err: any) {
      this.logger.warn(`FSL derleme hatasi (${data.name}): ${err.message}`);
    }

    const result = await this.db.query(
      `INSERT INTO configuration_objects (object_type, name, module, fsl_code, compiled_ast, metadata, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.object_type, data.name, data.module || null, data.fsl_code,
       compiledAst ? JSON.stringify(compiledAst) : null,
       JSON.stringify(metadata), tenantId],
    );

    this.logger.log(`Nesne olusturuldu: ${data.object_type}/${data.name}`);
    return result.rows[0];
  }

  /** Tum nesneleri listele (filtreli) */
  async findAll(filters?: {
    object_type?: string;
    module?: string;
    tenant_id?: string;
  }): Promise<ConfigObject[]> {
    const tenantId = filters?.tenant_id || DEFAULT_TENANT;
    let sql = 'SELECT * FROM configuration_objects WHERE tenant_id = $1 AND is_active = true';
    const params: any[] = [tenantId];

    if (filters?.object_type) {
      params.push(filters.object_type);
      sql += ` AND object_type = $${params.length}`;
    }
    if (filters?.module) {
      params.push(filters.module);
      sql += ` AND module = $${params.length}`;
    }

    sql += ' ORDER BY object_type, name';
    return (await this.db.query(sql, params)).rows;
  }

  /** Tek nesne getir */
  async findOne(id: string): Promise<ConfigObject> {
    const result = await this.db.query(
      'SELECT * FROM configuration_objects WHERE id = $1', [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Nesne bulunamadi');
    return result.rows[0];
  }

  /** Isim ile bul */
  async findByName(objectType: string, name: string, tenantId?: string): Promise<ConfigObject | null> {
    const result = await this.db.query(
      'SELECT * FROM configuration_objects WHERE object_type = $1 AND name = $2 AND tenant_id = $3',
      [objectType, name, tenantId || DEFAULT_TENANT],
    );
    return result.rows[0] || null;
  }

  /** FSL kodunu guncelle */
  async update(id: string, fslCode: string, userId?: string): Promise<ConfigObject> {
    const existing = await this.findOne(id);

    // FSL derle
    let compiledAst: any = null;
    let metadata: any = existing.metadata || {};
    try {
      const result = this.compiler.compile(fslCode);
      compiledAst = result.ast[0];
      metadata = {
        ...metadata,
        fieldCount: compiledAst?.fields?.length || 0,
        hasMethods: !!compiledAst?.methods?.length,
        hasTriggers: !!compiledAst?.triggers?.triggers?.length,
      };
    } catch (err: any) {
      this.logger.warn(`FSL derleme hatasi: ${err.message}`);
    }

    // Gecmise kaydet
    await this.db.query(
      `INSERT INTO configuration_history (object_id, version, fsl_code, compiled_ast, changed_by, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, existing.version, existing.fsl_code,
       existing.compiled_ast ? JSON.stringify(existing.compiled_ast) : null,
       userId, existing.tenant_id],
    );

    // Guncelle
    const result = await this.db.query(
      `UPDATE configuration_objects
       SET fsl_code = $1, compiled_ast = $2, metadata = $3, version = version + 1,
           updated_by = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [fslCode, compiledAst ? JSON.stringify(compiledAst) : null,
       JSON.stringify(metadata), userId, id],
    );

    this.logger.log(`Nesne guncellendi: ${existing.object_type}/${existing.name} (v${existing.version + 1})`);
    return result.rows[0];
  }

  /** Nesne sil (soft delete) */
  async remove(id: string): Promise<void> {
    await this.db.query(
      'UPDATE configuration_objects SET is_active = false, updated_at = NOW() WHERE id = $1', [id],
    );
  }

  // ============================================================
  // TOPLU ISLEMLER
  // ============================================================

  /** Disk'teki FSL dosyalarini DB'ye yukle (seed/migration) */
  async seedFromDisk(): Promise<number> {
    const fs = await import('fs');
    const path = await import('path');

    const packagesDir = this.findPackagesDir();
    if (!packagesDir) return 0;

    let count = 0;
    const moduleDirs = fs.readdirSync(packagesDir).filter((d: string) => d.startsWith('module-'));

    for (const moduleDir of moduleDirs) {
      const moduleName = moduleDir.replace('module-', '');
      const entitiesDir = path.join(packagesDir, moduleDir, 'src', 'entities');
      const formsDir = path.join(packagesDir, moduleDir, 'src', 'forms');

      // Entity/Document/Register dosyalari
      if (fs.existsSync(entitiesDir)) {
        for (const file of fs.readdirSync(entitiesDir).filter((f: string) => f.endsWith('.fsl'))) {
          const fslCode = fs.readFileSync(path.join(entitiesDir, file), 'utf-8');
          const objectType = this.detectObjectType(fslCode);
          const objectName = this.extractName(fslCode);

          if (objectName) {
            const existing = await this.findByName(objectType, objectName);
            if (!existing) {
              await this.create({ object_type: objectType, name: objectName, module: moduleName, fsl_code: fslCode });
              count++;
            }
          }
        }
      }

      // Form dosyalari
      if (fs.existsSync(formsDir)) {
        for (const file of fs.readdirSync(formsDir).filter((f: string) => f.endsWith('.fsl'))) {
          const fslCode = fs.readFileSync(path.join(formsDir, file), 'utf-8');
          const objectName = this.extractName(fslCode);

          if (objectName) {
            const existing = await this.findByName('form', objectName);
            if (!existing) {
              await this.create({ object_type: 'form', name: objectName, module: moduleName, fsl_code: fslCode });
              count++;
            }
          }
        }
      }
    }

    this.logger.log(`DB'ye ${count} nesne yuklendi (seed)`);
    return count;
  }

  /** Configuration agaci icin gruplanmis liste */
  async getConfigurationTree(tenantId?: string): Promise<Record<string, ConfigObject[]>> {
    const all = await this.findAll({ tenant_id: tenantId });
    const tree: Record<string, ConfigObject[]> = {};

    for (const obj of all) {
      const key = obj.object_type;
      if (!tree[key]) tree[key] = [];
      tree[key].push(obj);
    }

    return tree;
  }

  // ============================================================
  // YARDIMCI
  // ============================================================

  private detectObjectType(fslCode: string): string {
    if (fslCode.match(/^\s*document\s/m)) return 'document';
    if (fslCode.match(/^\s*register\s/m)) return 'register';
    if (fslCode.match(/^\s*form\s/m)) return 'form';
    if (fslCode.match(/^\s*report\s/m)) return 'report';
    if (fslCode.match(/^\s*workflow\s/m)) return 'workflow';
    return 'entity';
  }

  private extractName(fslCode: string): string | null {
    const match = fslCode.match(/(?:entity|document|register|form|report|workflow)\s+(\w+)/);
    return match ? match[1] : null;
  }

  private findPackagesDir(): string | null {
    const fs = require('fs');
    const path = require('path');
    const candidates = [
      path.resolve(process.cwd(), 'packages'),
      path.resolve(process.cwd(), '..', '..', 'packages'),
      path.resolve(process.cwd(), '..', 'packages'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(dir)) return dir;
    }
    return null;
  }
}
