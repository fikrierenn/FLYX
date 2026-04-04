/**
 * JWT Kimlik Doğrulama Guard'ı
 * ============================
 * Authorization header'ındaki Bearer token'ı kontrol eder.
 * @Public() decorator'ı ile işaretlenen route'lar bu kontrolü atlar.
 *
 * Kullanım sırası: TenantMiddleware → JwtAuthGuard → RolesGuard → Controller
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Metadata anahtarı - @Public() decorator'ı bu değeri atar */
export const IS_PUBLIC_KEY = 'isPublic';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    // Token validation will be handled by AuthModule
    // For now, extract and attach
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    return true;
  }
}
