import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { TenantRequest } from '../middleware/tenant.middleware';

/**
 * Ensures a valid tenant context exists for the request.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    if (!request.tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    return true;
  }
}
