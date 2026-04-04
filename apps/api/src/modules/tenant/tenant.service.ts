import { Injectable } from '@nestjs/common';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
}

@Injectable()
export class TenantService {
  // In-memory store for development; replace with DB in production
  private tenants: Map<string, Tenant> = new Map();

  async findBySlug(slug: string): Promise<Tenant | undefined> {
    for (const tenant of this.tenants.values()) {
      if (tenant.slug === slug) return tenant;
    }
    return undefined;
  }

  async findById(id: string): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async create(data: Omit<Tenant, 'id'>): Promise<Tenant> {
    const id = crypto.randomUUID();
    const tenant: Tenant = { id, ...data };
    this.tenants.set(id, tenant);
    return tenant;
  }

  async list(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }
}
