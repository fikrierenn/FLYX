/**
 * FLYX Platform - Ana Uygulama Modulu
 * ====================================
 * Tum alt modulleri birlestir, middleware ve guard'lari yapilandir.
 */

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { envConfig } from './config/env.config';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

// Moduller
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FSLModule } from './modules/fsl/fsl.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { AuditModule } from './modules/audit/audit.module';
import { RolesModule } from './modules/roles/roles.module';
import { RuntimeModule } from './modules/runtime/runtime.module';

@Module({
  imports: [
    // Ortam degiskenleri
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),

    // Rate limiting (varsayilan: 100 istek / 60 saniye)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Altyapi
    DatabaseModule,
    HealthModule,

    // Is modulleri
    TenantModule,
    AuthModule,
    UsersModule,
    FSLModule,
    EntitiesModule,
    AuditModule,
    RolesModule,
    RuntimeModule,
  ],
  providers: [
    // Global rate limit guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
