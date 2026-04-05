/**
 * Kimlik Dogrulama Servisi
 * =========================
 * Gercek kullanici dogrulamasi: email + sifre → bcrypt karsilastirma.
 * Access token (15dk) + Refresh token (30 gun) ikili token sistemi.
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    tenant_id: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /** Kayit - yeni kullanici olustur + token dondur */
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    tenant_id: string;
  }): Promise<AuthResponse> {
    const user = await this.usersService.create(data);
    return this.generateTokens(user);
  }

  /** Login - email + sifre dogrula + token dondur */
  async login(email: string, password: string, tenantId: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email, tenantId);

    if (!user) {
      throw new UnauthorizedException('Email veya sifre hatali');
    }

    const isValid = await this.usersService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Email veya sifre hatali');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Hesap aktif degil');
    }

    const { password_hash, ...safeUser } = user;
    return this.generateTokens(safeUser);
  }

  /** Refresh token ile yeni access token al */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const accessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email, roles: payload.roles, tenantId: payload.tenantId },
        { expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m' },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Gecersiz refresh token');
    }
  }

  /** Access token dogrula */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Gecersiz token');
    }
  }

  /** Access + Refresh token cifti uret */
  private generateTokens(user: any): AuthResponse {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenant_id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') || '30d',
    });

    return { accessToken, refreshToken, user };
  }
}
