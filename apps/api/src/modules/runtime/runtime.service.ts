/**
 * Runtime Entity Loader
 * ======================
 * FSL dosyalarini okur → derler → DB tablolarini olusturur → CRUD endpoint kayit eder.
 * Bu servis FLYX'in kalbi - FSL'den calisan uygulamaya gecisi saglar.
 *
 * Zincir:
 *   .fsl dosyasi → FSLCompiler.compile() → EntityDeclaration AST
 *       → TableGenerator.generateFullSQL() → DatabaseService.query() → PostgreSQL tablo
 *       → Dinamik CRUD endpoint'leri (list, get, create, update, delete)
 *       → RolesService.loadFromFSLDefaults() → Yetki matrisi
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FSLCompiler } from '@flyx/fsl-compiler';
import type { EntityDeclaration, FormDeclaration, Declaration } from '@flyx/fsl-compiler';
import { TableGenerator } from '@flyx/database-engine';
import { DatabaseService } from '../database/database.module';
import { RolesService } from '../roles/roles.service';
import { FSLRuntime } from '@flyx/runtime-engine';
import { ConfigurationService } from '../configuration/configuration.service';

export interface LoadedEntity {
  name: string;
  tableName: string;
  fields: EntityDeclaration['fields'];
  sql: string;
  permissions?: EntityDeclaration['permissions'];
  /** AST referansi - runtime engine trigger/method calistirmak icin */
  ast: EntityDeclaration;
}

export interface LoadedForm {
  name: string;
  entity: string;
  layout?: string;
  sections: FormDeclaration['sections'];
  actions?: FormDeclaration['actions'];
}

@Injectable()
export class RuntimeService implements OnModuleInit {
  private readonly logger = new Logger('RuntimeService');
  private readonly compiler = new FSLCompiler();
  private readonly tableGenerator = new TableGenerator();
  private readonly fslRuntime = new FSLRuntime();

  private entities = new Map<string, LoadedEntity>();
  private forms = new Map<string, LoadedForm>();

  constructor(
    private readonly db: DatabaseService,
    private readonly rolesService: RolesService,
    private readonly configService: ConfigurationService,
  ) {}

  async onModuleInit() {
    // Runtime engine'e DB sorgu calistiricisini bagla
    this.fslRuntime.setQueryExecutor(this.db);

    // 1. Configuration tablolarini olustur
    try {
      await this.configService.runMigrations();
    } catch (err: any) {
      this.logger.warn(`Migration hatasi: ${err.message}`);
    }

    // 2. DB'den konfigurasyonu yukle
    let dbObjects = await this.configService.findAll();

    // 3. DB bossa → disk'ten seed yap (ilk kurulum)
    if (dbObjects.length === 0) {
      this.logger.log('DB bos - disk FSL dosyalarindan seed yapiliyor...');
      const seedCount = await this.configService.seedFromDisk();
      if (seedCount > 0) {
        dbObjects = await this.configService.findAll();
        this.logger.log(`${seedCount} nesne disk'ten DB'ye yuklendi`);
      } else {
        // Seed de basarisizsa eski yontemle disk'ten yukle (fallback)
        this.logger.warn('Seed basarisiz - disk fallback');
        await this.loadFromDiskFallback();
        return;
      }
    }

    // 4. DB'deki nesneleri Runtime'a yukle
    for (const obj of dbObjects) {
      try {
        if (['entity', 'document', 'register'].includes(obj.object_type)) {
          const ast = obj.compiled_ast || this.compileFSL(obj.fsl_code);
          if (ast) await this.registerEntity(ast);
        } else if (obj.object_type === 'form') {
          const ast = obj.compiled_ast || this.compileFSL(obj.fsl_code);
          if (ast) this.registerForm(ast as any);
        }
      } catch (err: any) {
        this.logger.warn(`${obj.object_type}/${obj.name} yuklenemedi: ${err.message}`);
      }
    }

    this.logger.log(`DB'den yuklendi: ${this.entities.size} entity, ${this.forms.size} form`);
  }

  /** FSL kodunu derle (cache yoksa) */
  private compileFSL(fslCode: string): any {
    try {
      const result = this.compiler.compile(fslCode);
      return result.ast[0];
    } catch {
      return null;
    }
  }

  /** Disk fallback (DB kullanilamazsa eski yontem) */
  private async loadFromDiskFallback() {
    const modulePaths = this.findModulePaths();
    if (modulePaths.length > 0) {
      for (const modulePath of modulePaths) {
        await this.loadModuleFromPath(modulePath);
      }
      this.logger.log(`Disk fallback: ${this.entities.size} entity, ${this.forms.size} form`);
    }
  }

  /** Modul dizinlerini bul (packages/module-*) */
  private findModulePaths(): string[] {
    // Birden fazla olasi yol dene
    const candidates = [
      path.resolve(process.cwd(), 'packages'),           // monorepo root
      path.resolve(process.cwd(), '..', '..', 'packages'), // apps/api icinden
      path.resolve(process.cwd(), '..', 'packages'),      // apps/ icinden
      path.resolve(__dirname, '..', '..', '..', '..', '..', 'packages'), // dist icinden
    ];

    for (const dir of candidates) {
      if (fs.existsSync(dir)) {
        const modules = fs.readdirSync(dir)
          .filter((d) => d.startsWith('module-'))
          .map((d) => path.join(dir, d));
        if (modules.length > 0) {
          this.logger.log(`Modul dizini bulundu: ${dir} (${modules.length} modul)`);
          return modules;
        }
      }
    }

    this.logger.warn('Modul dizini bulunamadi. Aranan yerler: ' + candidates.join(', '));
    return [];
  }

  /** Bir modul dizinindeki tum FSL dosyalarini yukle */
  async loadModuleFromPath(modulePath: string): Promise<void> {
    const moduleName = path.basename(modulePath);
    const entitiesDir = path.join(modulePath, 'src', 'entities');
    const formsDir = path.join(modulePath, 'src', 'forms');

    // Entity'leri yukle
    if (fs.existsSync(entitiesDir)) {
      const files = fs.readdirSync(entitiesDir).filter((f) => f.endsWith('.fsl'));
      for (const file of files) {
        const fslPath = path.join(entitiesDir, file);
        try {
          await this.loadFSLFile(fslPath);
        } catch (err: any) {
          this.logger.error(`${moduleName}/${file} yuklenemedi: ${err.message}`);
        }
      }
    }

    // Form'lari yukle
    if (fs.existsSync(formsDir)) {
      const files = fs.readdirSync(formsDir).filter((f) => f.endsWith('.fsl'));
      for (const file of files) {
        const fslPath = path.join(formsDir, file);
        try {
          await this.loadFSLFile(fslPath);
        } catch (err: any) {
          this.logger.error(`${moduleName}/${file} yuklenemedi: ${err.message}`);
        }
      }
    }
  }

  /** Tek bir FSL dosyasini oku, derle, kayit et */
  async loadFSLFile(filePath: string): Promise<void> {
    const source = fs.readFileSync(filePath, 'utf-8');
    const result = this.compiler.compile(source);

    for (const decl of result.ast) {
      if (decl.type === 'EntityDeclaration' || decl.type === 'DocumentDeclaration' || decl.type === 'RegisterDeclaration') {
        // Entity, Document ve Register hepsi ayni sekilde DB tablosu + CRUD olusturur
        await this.registerEntity(decl as EntityDeclaration);
      } else if (decl.type === 'FormDeclaration') {
        this.registerForm(decl as FormDeclaration);
      }
    }
  }

  /** Entity'yi kayit et + DB tablosu olustur + yetki matrisi yukle */
  async registerEntity(entity: EntityDeclaration): Promise<LoadedEntity> {
    const sql = this.tableGenerator.generateFullSQL(entity);
    const tableName = entity.name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');

    const loaded: LoadedEntity = {
      name: entity.name,
      tableName,
      fields: entity.fields,
      sql,
      ast: entity,
      permissions: entity.permissions,
    };

    this.entities.set(entity.name, loaded);

    // DB tablosu olustur (hata varsa logla, devam et)
    try {
      await this.db.query(sql);
      this.logger.log(`Tablo olusturuldu: ${tableName}`);
    } catch (err: any) {
      // "already exists" hatasi normaldir
      if (err.message?.includes('already exists')) {
        this.logger.debug(`Tablo zaten var: ${tableName}`);
      } else {
        this.logger.warn(`Tablo olusturulamadi: ${tableName} - ${err.message}`);
      }
    }

    // Yetki matrisine varsayilan yetkileri yukle
    if (entity.permissions) {
      try {
        await this.rolesService.loadFromFSLDefaults(entity.name, entity.permissions, 'default');
      } catch (err: any) {
        this.logger.warn(`Yetkiler yuklenemedi: ${entity.name} - ${err.message}`);
      }
    }

    return loaded;
  }

  /** Form'u kayit et */
  registerForm(form: FormDeclaration): void {
    this.forms.set(form.name, {
      name: form.name,
      entity: form.entity,
      layout: form.layout,
      sections: form.sections,
      actions: form.actions,
    });
  }

  // ============================================================
  // DINAMIK CRUD ISLEMLERI
  // ============================================================

  /** Entity listele (SELECT * FROM table WHERE tenant_id = ?) */
  async findAll(entityName: string, tenantId: string, page = 1, limit = 20): Promise<any> {
    const entity = this.entities.get(entityName);
    if (!entity) throw new Error(`Entity bulunamadi: ${entityName}`);

    const offset = (page - 1) * limit;
    const result = await this.db.query(
      `SELECT * FROM ${entity.tableName} WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );

    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM ${entity.tableName} WHERE tenant_id = $1`,
      [tenantId],
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    };
  }

  /** Tek kayit getir */
  async findOne(entityName: string, id: string, tenantId: string): Promise<any> {
    const entity = this.entities.get(entityName);
    if (!entity) throw new Error(`Entity bulunamadi: ${entityName}`);

    const result = await this.db.query(
      `SELECT * FROM ${entity.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    return result.rows[0] || null;
  }

  /** Yeni kayit olustur - before_create trigger otomatik calisir */
  async create(entityName: string, data: Record<string, any>, tenantId: string, userId?: string): Promise<any> {
    const entity = this.entities.get(entityName);
    if (!entity) throw new Error(`Entity bulunamadi: ${entityName}`);

    // FSL before_create trigger'ini calistir (hesaplama, varsayilan deger atama vb.)
    data = this.fslRuntime.executeTrigger(entity.ast, 'before_create', data);

    const columns = ['tenant_id', 'created_at'];
    const values: any[] = [tenantId, new Date()];
    let paramIndex = 3;

    if (userId) {
      columns.push('created_by');
      values.push(userId);
      paramIndex++;
    }

    for (const field of entity.fields) {
      if (data[field.name] !== undefined && field.dataType.name !== 'Computed') {
        columns.push(field.name.replace(/([A-Z])/g, '_$1').toLowerCase());
        values.push(data[field.name]);
        paramIndex++;
      }
    }

    const placeholders = values.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO ${entity.tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

    const result = await this.db.query(sql, values);
    const created = result.rows[0];

    // FSL after_create trigger'ini calistir (email gonderme, log atma vb.)
    try {
      this.fslRuntime.executeTrigger(entity.ast, 'after_create', created);
    } catch (err: any) {
      this.logger.warn(`after_create trigger hatasi (${entityName}): ${err.message}`);
    }

    return created;
  }

  /** Kayit guncelle - before_update trigger otomatik calisir */
  async update(entityName: string, id: string, data: Record<string, any>, tenantId: string, userId?: string): Promise<any> {
    const entity = this.entities.get(entityName);
    if (!entity) throw new Error(`Entity bulunamadi: ${entityName}`);

    // FSL before_update trigger'ini calistir
    data = this.fslRuntime.executeTrigger(entity.ast, 'before_update', data);

    const setParts: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (userId) {
      setParts.push(`updated_by = $${paramIndex}`);
      values.push(userId);
      paramIndex++;
    }

    for (const field of entity.fields) {
      if (data[field.name] !== undefined && field.dataType.name !== 'Computed') {
        const colName = field.name.replace(/([A-Z])/g, '_$1').toLowerCase();
        setParts.push(`${colName} = $${paramIndex}`);
        values.push(data[field.name]);
        paramIndex++;
      }
    }

    values.push(id, tenantId);
    const sql = `UPDATE ${entity.tableName} SET ${setParts.join(', ')} WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1} RETURNING *`;

    const result = await this.db.query(sql, values);
    return result.rows[0];
  }

  /** Kayit sil */
  async remove(entityName: string, id: string, tenantId: string): Promise<boolean> {
    const entity = this.entities.get(entityName);
    if (!entity) throw new Error(`Entity bulunamadi: ${entityName}`);

    const result = await this.db.query(
      `DELETE FROM ${entity.tableName} WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  // ============================================================
  // META BILGI
  // ============================================================

  getLoadedEntities(): string[] {
    return Array.from(this.entities.keys());
  }

  getLoadedForms(): string[] {
    return Array.from(this.forms.keys());
  }

  getEntitySchema(name: string): LoadedEntity | undefined {
    return this.entities.get(name);
  }

  getFormSchema(name: string): LoadedForm | undefined {
    return this.forms.get(name);
  }
}
