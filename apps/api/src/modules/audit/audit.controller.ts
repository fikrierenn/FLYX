/**
 * Audit Log Controller
 * =====================
 * Audit loglarini sorgulama endpoint'i. Sadece admin erisebilir.
 */

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Audit loglarini listele' })
  async findAll(
    @Query('resource') resource?: string,
    @Query('user_id') user_id?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.auditService.findByTenant('default', {
      resource,
      user_id,
      limit: limit || 50,
      offset: offset || 0,
    });
  }
}
