/**
 * Saglik Kontrol Endpoint'leri
 * ==============================
 * Load balancer ve Kubernetes icin saglik kontrolu.
 * /health → API calisiyor mu
 * /health/ready → DB baglantisi var mi
 */

import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.module';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness check - API calisiyor mu' })
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check - DB baglantisi dahil' })
  async readiness() {
    const dbHealthy = await this.db.isHealthy();
    return {
      status: dbHealthy ? 'ready' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
