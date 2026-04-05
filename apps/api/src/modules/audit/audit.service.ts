/**
 * Audit Log Servisi
 * ==================
 * Kim ne zaman ne yapti - tum CRUD islemlerini loglar.
 * SOX, HIPAA gibi uyumluluk gereksinimleri icin kritik.
 */

import { Injectable, Logger } from '@nestjs/common';

export interface AuditEntry {
  id: string;
  user_id: string;
  user_email: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource: string;
  resource_id: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address: string;
  tenant_id: string;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');
  private logs: AuditEntry[] = [];

  /** Audit kaydi olustur */
  async log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.logs.push(auditEntry);
    this.logger.log(
      `[${entry.action}] ${entry.resource}/${entry.resource_id} by ${entry.user_email} (${entry.tenant_id})`,
    );
  }

  /** Tenant bazli audit loglari sorgula */
  async findByTenant(
    tenant_id: string,
    options?: { resource?: string; user_id?: string; limit?: number; offset?: number },
  ): Promise<{ data: AuditEntry[]; total: number }> {
    let filtered = this.logs.filter((l) => l.tenant_id === tenant_id);

    if (options?.resource) {
      filtered = filtered.filter((l) => l.resource === options.resource);
    }
    if (options?.user_id) {
      filtered = filtered.filter((l) => l.user_id === options.user_id);
    }

    const total = filtered.length;
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return {
      data: filtered.slice(offset, offset + limit).reverse(),
      total,
    };
  }
}
