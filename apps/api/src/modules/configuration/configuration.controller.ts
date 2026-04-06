/**
 * Configuration Controller
 * ==========================
 * Configurator UI'in kullandigi API endpoint'leri.
 * Nesne olusturma, okuma, guncelleme, silme + agac gorunumu.
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';

@ApiTags('configuration')
@Controller('v1/configuration')
export class ConfigurationController {
  constructor(private readonly configService: ConfigurationService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Configuration agaci (Configurator sidebar icin)' })
  async getTree() {
    return this.configService.getConfigurationTree();
  }

  @Get('objects')
  @ApiOperation({ summary: 'Tum nesneleri listele (filtreli)' })
  async findAll(
    @Query('type') objectType?: string,
    @Query('module') module?: string,
  ) {
    return this.configService.findAll({ object_type: objectType, module });
  }

  @Get('objects/:id')
  @ApiOperation({ summary: 'Tek nesne detayi (FSL kodu dahil)' })
  async findOne(@Param('id') id: string) {
    return this.configService.findOne(id);
  }

  @Post('objects')
  @ApiOperation({ summary: 'Yeni nesne olustur (FSL kodu ile)' })
  async create(@Body() body: {
    object_type: string;
    name: string;
    module?: string;
    fsl_code: string;
  }) {
    return this.configService.create(body);
  }

  @Put('objects/:id')
  @ApiOperation({ summary: 'Nesne FSL kodunu guncelle' })
  async update(@Param('id') id: string, @Body() body: { fsl_code: string }) {
    return this.configService.update(id, body.fsl_code);
  }

  @Delete('objects/:id')
  @ApiOperation({ summary: 'Nesne sil (soft delete)' })
  async remove(@Param('id') id: string) {
    return this.configService.remove(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Disk FSL dosyalarini DB ye yukle (ilk kurulum)' })
  async seed() {
    const count = await this.configService.seedFromDisk();
    return { seeded: count };
  }

  @Post('migrate')
  @ApiOperation({ summary: 'DB tablolarini olustur' })
  async migrate() {
    await this.configService.runMigrations();
    return { success: true };
  }
}
