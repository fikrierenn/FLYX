/**
 * RBAC (Rol Bazlı Erişim Kontrolü) Guard'ı
 * ==========================================
 * FSL entity'lerindeki permissions bloğundan gelen roller ile
 * kullanıcının rollerini karşılaştırır.
 *
 * Örnek FSL:
 *   permissions { create: ["admin", "manager"] }
 *
 * Kod üretici bu rolleri @Roles('admin', 'manager') decorator'ına dönüştürür.
 * Bu guard o decorator'daki rolleri okur ve kullanıcının rollerini kontrol eder.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/** Metadata anahtarı - @Roles() decorator'ı bu değeri atar */
export const ROLES_KEY = 'roles';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const hasRole = requiredRoles.some((role: string) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
