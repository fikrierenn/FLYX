/**
 * FLYX NestJS Controller Üretici
 * ===============================
 * FSL entity tanımından tam donanımlı bir NestJS REST API controller'ı üretir.
 *
 * Üretilen controller özellikleri:
 * - CRUD endpoint'leri (GET list, GET by ID, POST, PUT, DELETE)
 * - Swagger/OpenAPI dekoratörleri (@ApiTags, @ApiOperation, @ApiBearerAuth)
 * - JWT kimlik doğrulama guard'ı (@UseGuards(JwtAuthGuard))
 * - Rol tabanlı yetkilendirme (@Roles dekoratörü)
 * - FSL permissions tanımından otomatik rol ataması
 * - Sayfalama desteği (page, limit query parametreleri)
 *
 * Rol Yönetimi:
 *   FSL'de entity.permissions tanımlanmışsa, her CRUD operasyonu için
 *   belirtilen roller kullanılır. Tanımlanmamışsa varsayılan olarak
 *   tüm operasyonlar 'admin' rolüne atanır.
 */

import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toCamelCase, toPlural } from '../../utils/string-helpers.js';

/**
 * NestJS Controller üretici sınıfı.
 * Entity tanımını alır ve string olarak controller kaynak kodunu döndürür.
 */
export class NestJSControllerGenerator {
  /**
   * Verilen entity için NestJS controller kodu üretir.
   *
   * @param entity - FSL entity tanımı (isim, alanlar ve izinler içerir)
   * @returns Üretilen controller TypeScript kaynak kodu
   */
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const plural = toPlural(name);
    // Service sınıf adı ve dependency injection değişken adı
    const serviceName = `${name}sService`;
    const serviceVar = toCamelCase(serviceName);
    // DTO sınıf adları (Create ve Update)
    const createDto = `Create${name}Dto`;
    const updateDto = `Update${name}Dto`;

    // FSL permissions tanımından CRUD rolleri çıkarılır, yoksa 'admin' varsayılır
    const createRoles = entity.permissions?.create || ['admin'];
    const readRoles = entity.permissions?.read || ['admin'];
    const updateRoles = entity.permissions?.update || ['admin'];
    const deleteRoles = entity.permissions?.delete || ['admin'];

    /** Rol dizisini @Roles dekoratörü için string formatına çevirir */
    const fmtRoles = (roles: string[]) => roles.map((r) => `'${r}'`).join(', ');

    return `import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { ${serviceName} } from './${plural}.service';
import { ${createDto} } from './dto/create-${name.toLowerCase()}.dto';
import { ${updateDto} } from './dto/update-${name.toLowerCase()}.dto';

@ApiTags('${plural}')
@ApiBearerAuth()
@Controller('${plural}')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ${name}sController {
  constructor(private readonly ${serviceVar}: ${serviceName}) {}

  @Get()
  @Roles(${fmtRoles(readRoles)})
  @ApiOperation({ summary: 'List all ${plural}' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.${serviceVar}.findAll({ page, limit });
  }

  @Get(':id')
  @Roles(${fmtRoles(readRoles)})
  @ApiOperation({ summary: 'Get ${name} by ID' })
  findOne(@Param('id') id: string) {
    return this.${serviceVar}.findOne(id);
  }

  @Post()
  @Roles(${fmtRoles(createRoles)})
  @ApiOperation({ summary: 'Create new ${name}' })
  create(@Body() dto: ${createDto}) {
    return this.${serviceVar}.create(dto);
  }

  @Put(':id')
  @Roles(${fmtRoles(updateRoles)})
  @ApiOperation({ summary: 'Update ${name}' })
  update(@Param('id') id: string, @Body() dto: ${updateDto}) {
    return this.${serviceVar}.update(id, dto);
  }

  @Delete(':id')
  @Roles(${fmtRoles(deleteRoles)})
  @ApiOperation({ summary: 'Delete ${name}' })
  remove(@Param('id') id: string) {
    return this.${serviceVar}.remove(id);
  }
}`;
  }
}
