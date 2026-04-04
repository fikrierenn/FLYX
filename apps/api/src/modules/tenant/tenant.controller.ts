import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantService, Tenant } from './tenant.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  async list(): Promise<Tenant[]> {
    return this.tenantService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() body: Omit<Tenant, 'id'>): Promise<Tenant> {
    return this.tenantService.create(body);
  }
}
