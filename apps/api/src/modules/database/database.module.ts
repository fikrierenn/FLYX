/**
 * Veritabani Modulu
 * ==================
 * PostgreSQL baglantisini yonetir. Connection pool ile verimli sorgu calistirma.
 */

import { Module, Global, Injectable, Inject, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, type PoolClient, type QueryResult } from 'pg';

// ============================================================
// Database Service (Module'den once tanimlanmali)
// ============================================================

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Database');

  constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.logger.log('PostgreSQL baglantisi basarili');
    } catch (err: any) {
      this.logger.warn(`PostgreSQL baglantisi basarisiz: ${err.message} (DB olmadan devam ediliyor)`);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /** SQL sorgusu calistir */
  async query(sql: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    const result = await this.pool.query(sql, params);
    this.logger.debug(`SQL (${Date.now() - start}ms): ${sql.substring(0, 100)}`);
    return result;
  }

  /** Transaction baslat */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /** Transaction ile islem yap */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Baglanti saglik kontrolu */
  async isHealthy(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================
// Database Module
// ============================================================

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: (config: ConfigService) => {
        return new Pool({
          connectionString: config.get<string>('database.url'),
          max: config.get<number>('database.poolSize') || 10,
        });
      },
      inject: [ConfigService],
    },
    DatabaseService,
  ],
  exports: ['DATABASE_POOL', DatabaseService],
})
export class DatabaseModule {}
