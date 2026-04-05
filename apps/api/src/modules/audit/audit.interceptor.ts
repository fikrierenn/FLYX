/**
 * Audit Interceptor
 * ==================
 * Her CRUD istegini otomatik olarak audit log'a kaydeder.
 * Controller'lara tek tek eklenmesine gerek yok - global olarak calisir.
 */

import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body } = request;

    // Sadece degisiklik yapan istekleri logla (GET haric)
    if (method === 'GET') return next.handle();

    const action = this.methodToAction(method);
    if (!action) return next.handle();

    // Resource ve ID'yi URL'den cikar (/v1/users/123 → resource: users, id: 123)
    const urlParts = url.split('/').filter(Boolean);
    const resource = urlParts.find((p: string) => !['v1', 'api'].includes(p)) || 'unknown';
    const resource_id = urlParts[urlParts.length - 1] || '';

    const userId = request.user?.sub || 'anonymous';
    const userEmail = request.user?.email || 'anonymous';
    const tenantId = request.tenantId || 'default';

    return next.handle().pipe(
      tap((responseData) => {
        this.auditService.log({
          user_id: userId,
          user_email: userEmail,
          action,
          resource,
          resource_id: responseData?.id || resource_id,
          new_value: method === 'DELETE' ? undefined : body,
          ip_address: ip || '0.0.0.0',
          tenant_id: tenantId,
        }).catch((err) => {
          this.logger.error(`Audit log hatasi: ${err.message}`);
        });
      }),
    );
  }

  private methodToAction(method: string): AuditEntry['action'] | null {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PUT':
      case 'PATCH': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return null;
    }
  }
}

type AuditEntry = { action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' };
