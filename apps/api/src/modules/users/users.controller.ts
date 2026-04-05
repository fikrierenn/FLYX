/**
 * Kullanici Controller
 * =====================
 * Kullanici CRUD endpoint'leri. Admin rolu gerektirir.
 */

import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators';

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Tenant kullanicilarini listele' })
  async findAll() {
    // TODO: tenant_id'yi request context'ten al
    return this.usersService.findByTenant('default');
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Yeni kullanici olustur' })
  async create(@Body() body: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    roles?: string[];
  }) {
    return this.usersService.create({
      ...body,
      tenant_id: 'default', // TODO: request context'ten al
    });
  }

  @Put(':id/roles')
  @Roles('admin')
  @ApiOperation({ summary: 'Kullanici rollerini guncelle' })
  async updateRoles(@Param('id') id: string, @Body() body: { roles: string[] }) {
    return this.usersService.updateRoles(id, body.roles);
  }
}
