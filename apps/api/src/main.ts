/**
 * FLYX Platform API - Ana Giriş Noktası
 * =======================================
 * NestJS tabanlı REST API sunucusu.
 *
 * Özellikler:
 * - Multi-tenant mimari (subdomain veya header ile tenant çözümleme)
 * - JWT tabanlı kimlik doğrulama
 * - RBAC (Rol Bazlı Erişim Kontrolü)
 * - Swagger API dokümantasyonu (/api/docs)
 * - FSL derleme endpoint'leri
 * - Dinamik entity CRUD
 *
 * Çalıştırma:
 *   npm run start      → Production (dist/main.js)
 *   npm run start:dev  → Development (ts-node ile)
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Gelen isteklerdeki DTO'ları otomatik doğrula
  // whitelist: DTO'da tanımlı olmayan alanları otomatik sil
  // transform: string → number gibi tip dönüşümlerini otomatik yap
  // forbidNonWhitelisted: tanımsız alan gelirse 400 hatası ver
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Tüm origin'lerden gelen isteklere izin ver (geliştirme için)
  // Üretimde belirli domain'lerle sınırlandırılmalı
  app.enableCors();

  // Swagger UI yapılandırması - /api/docs adresinde erişilebilir
  // Tüm endpoint'ler otomatik olarak NestJS decorator'larından üretilir
  const config = new DocumentBuilder()
    .setTitle('FLYX Platform API')
    .setDescription('Multi-tenant business application platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`FLYX API running on port ${port}`);
}

bootstrap();
