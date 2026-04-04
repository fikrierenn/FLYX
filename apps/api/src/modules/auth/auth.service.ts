import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  tenantId: string;
}

export interface LoginDto {
  email: string;
  password: string;
  tenantId: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  tenantId: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthUser }> {
    // In production, validate credentials against DB
    // For development, accept any login
    const user: AuthUser = {
      id: crypto.randomUUID(),
      email: dto.email,
      roles: ['admin'],
      tenantId: dto.tenantId,
    };

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      tenantId: user.tenantId,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
