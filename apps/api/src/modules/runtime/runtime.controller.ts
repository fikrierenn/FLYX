/**
 * Runtime CRUD Controller
 * ========================
 * Dinamik entity endpoint'leri. FSL'den yuklenen HER entity icin
 * otomatik CRUD saglar. URL: /v1/data/:entity
 *
 * Ornekler:
 *   GET    /v1/data/Customer?page=1&limit=20
 *   GET    /v1/data/Customer/123
 *   POST   /v1/data/Customer  { "name": "Acme", "email": "a@b.com" }
 *   PUT    /v1/data/Customer/123  { "name": "Updated" }
 *   DELETE /v1/data/Customer/123
 *
 *   GET    /v1/data/_meta/entities  → yuklenen entity listesi
 *   GET    /v1/data/_meta/forms     → yuklenen form listesi
 *   GET    /v1/data/_meta/schema/Customer → entity field tanimlari
 *   GET    /v1/data/_meta/form/CustomerForm → form section/action tanimlari
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RuntimeService } from './runtime.service';

@ApiTags('data')
@ApiBearerAuth()
@Controller('v1/data')
export class RuntimeController {
  constructor(private readonly runtime: RuntimeService) {}

  // ============================================================
  // META ENDPOINTS
  // ============================================================

  @Get('_meta/entities')
  @ApiOperation({ summary: 'Yuklenen entity listesi' })
  getEntities() {
    return this.runtime.getLoadedEntities();
  }

  @Get('_meta/forms')
  @ApiOperation({ summary: 'Yuklenen form listesi' })
  getForms() {
    return this.runtime.getLoadedForms();
  }

  @Get('_meta/schema/:name')
  @ApiOperation({ summary: 'Entity sema bilgisi (field tanimlari)' })
  getSchema(@Param('name') name: string) {
    const schema = this.runtime.getEntitySchema(name);
    if (!schema) throw new NotFoundException(`Entity bulunamadi: ${name}`);
    return schema;
  }

  @Get('_meta/form/:name')
  @ApiOperation({ summary: 'Form sema bilgisi (section/action tanimlari)' })
  getFormSchema(@Param('name') name: string) {
    const form = this.runtime.getFormSchema(name);
    if (!form) throw new NotFoundException(`Form bulunamadi: ${name}`);
    return form;
  }

  // ============================================================
  // DINAMIK CRUD
  // ============================================================

  @Get(':entity')
  @ApiOperation({ summary: 'Entity kayitlarini listele' })
  async findAll(
    @Param('entity') entity: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    try {
      return await this.runtime.findAll(entity, 'default', page || 1, limit || 20);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Get(':entity/:id')
  @ApiOperation({ summary: 'Tek kayit getir' })
  async findOne(@Param('entity') entity: string, @Param('id') id: string) {
    try {
      const result = await this.runtime.findOne(entity, id, 'default');
      if (!result) throw new NotFoundException(`${entity} ${id} bulunamadi`);
      return result;
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(err.message);
    }
  }

  @Post(':entity')
  @ApiOperation({ summary: 'Yeni kayit olustur' })
  async create(@Param('entity') entity: string, @Body() data: Record<string, any>) {
    try {
      return await this.runtime.create(entity, data, 'default');
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Put(':entity/:id')
  @ApiOperation({ summary: 'Kayit guncelle' })
  async update(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @Body() data: Record<string, any>,
  ) {
    try {
      return await this.runtime.update(entity, id, data, 'default');
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Delete(':entity/:id')
  @ApiOperation({ summary: 'Kayit sil' })
  async remove(@Param('entity') entity: string, @Param('id') id: string) {
    try {
      const deleted = await this.runtime.remove(entity, id, 'default');
      if (!deleted) throw new NotFoundException(`${entity} ${id} bulunamadi`);
      return { deleted: true };
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(err.message);
    }
  }
}
