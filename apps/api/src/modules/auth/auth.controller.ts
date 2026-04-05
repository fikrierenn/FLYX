/**
 * Kimlik Dogrulama Controller
 * =============================
 * Register, Login, Refresh endpoint'leri. Hepsi @Public().
 */

import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Yeni kullanici kaydi' })
  async register(@Body() body: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_id: string;
  }) {
    return this.authService.register(body);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Email + sifre ile giris' })
  async login(@Body() body: { email: string; password: string; tenant_id: string }) {
    return this.authService.login(body.email, body.password, body.tenant_id);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh token ile yeni access token al' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }
}
