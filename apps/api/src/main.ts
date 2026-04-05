/**
 * FLYX Platform API - Ana Giris Noktasi
 * =======================================
 * NestJS tabanli REST API sunucusu.
 *
 * Ozellikler:
 * - Multi-tenant mimari
 * - JWT kimlik dogrulama (access + refresh token)
 * - RBAC (Rol Bazli Erisim Kontrolu)
 * - Swagger API dokumantasyonu (/api/docs)
 * - Helmet guvenlik header'lari
 * - Rate limiting
 * - Global exception filter
 * - Health check endpoint
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Guvenlik header'lari (XSS, clickjacking, sniffing korumasi)
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter (yapisal hata yanitlari)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS - ortam degiskeninden oku
  const corsOrigins = config.get<string[]>('cors.origins') || ['http://localhost:5173'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  // API versioning prefix
  app.setGlobalPrefix('', { exclude: ['health', 'health/ready'] });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FLYX Platform API')
    .setDescription('Multi-tenant enterprise application platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'tenant')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('port') || 3000;
  await app.listen(port);
  console.log(`FLYX API running on port ${port}`);
  console.log(`Swagger: http://localhost:${port}/api/docs`);
  console.log(`Health: http://localhost:${port}/health`);
}

bootstrap();
