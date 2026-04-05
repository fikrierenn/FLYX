/**
 * Rol & Yetki Controller
 * ========================
 * Dinamik rol yonetimi ve yetki matrisi endpoint'leri.
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService, type PermissionAction } from './roles.service';
import { Roles } from '../../common/decorators';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ============================================================
  // ROL CRUD
  // ============================================================

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Tum rolleri listele' })
  async findAll() {
    return this.rolesService.findRolesByTenant('default');
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Yeni rol olustur' })
  async create(@Body() body: { name: string; description: string }) {
    return this.rolesService.createRole({ ...body, tenant_id: 'default' });
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Rol sil (sistem rolleri silinemez)' })
  async remove(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // ============================================================
  // YETKI MATRISI
  // ============================================================

  @Get('matrix')
  @Roles('admin')
  @ApiOperation({ summary: 'Tam yetki matrisini getir (UI icin)' })
  async getMatrix() {
    return this.rolesService.getPermissionMatrix('default');
  }

  @Put('permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Tek bir yetki hucresini guncelle (toggle)' })
  async setPermission(@Body() body: {
    role_id: string;
    entity: string;
    action: PermissionAction;
    allowed: boolean;
  }) {
    return this.rolesService.setPermission({ ...body, tenant_id: 'default' });
  }

  @Put('permissions/bulk')
  @Roles('admin')
  @ApiOperation({ summary: 'Bir rol icin toplu yetki ata' })
  async setBulkPermissions(@Body() body: {
    role_id: string;
    permissions: { entity: string; actions: PermissionAction[] }[];
  }) {
    return this.rolesService.setBulkPermissions({ ...body, tenant_id: 'default' });
  }

  @Get('check')
  @ApiOperation({ summary: 'Yetki kontrolu (runtime)' })
  async checkPermission(
    @Query('roles') roles: string,
    @Query('entity') entity: string,
    @Query('action') action: PermissionAction,
  ) {
    const roleList = roles.split(',');
    const allowed = await this.rolesService.hasPermission(roleList, entity, action, 'default');
    return { allowed };
  }
}
