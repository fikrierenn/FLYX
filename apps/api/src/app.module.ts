/**
 * FLYX Platform - Ana Uygulama Modülü
 * ====================================
 * Tüm alt modülleri bir araya getirir ve global middleware'leri yapılandırır.
 *
 * Modüller:
 * - TenantModule: Çoklu kiracı (multi-tenant) yönetimi
 * - AuthModule: JWT kimlik doğrulama ve yetkilendirme
 * - FSLModule: FSL kodu derleme ve SQL üretme endpoint'leri
 * - EntitiesModule: Dinamik entity CRUD işlemleri
 *
 * Middleware:
 * - TenantMiddleware: Her isteğe tenant_id bağlamı ekler
 *   (subdomain veya X-Tenant-ID header'ından çözümlenir)
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { FSLModule } from './modules/fsl/fsl.module';
import { EntitiesModule } from './modules/entities/entities.module';

@Module({
  imports: [TenantModule, AuthModule, FSLModule, EntitiesModule],
})
export class AppModule implements NestModule {
  // TenantMiddleware tüm route'lara uygulanır ('*')
  // Her gelen istek önce tenant bağlamından geçer
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
