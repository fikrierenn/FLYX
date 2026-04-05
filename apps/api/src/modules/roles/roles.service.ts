/**
 * Dinamik Rol & Yetki Servisi
 * =============================
 * Roller ve yetkiler veritabaninda saklanir, admin panelinden yonetilir.
 * FSL'deki permissions blogu sadece VARSAYILAN yetkileri belirler.
 * Sonrasinda admin UI'dan matris seklinde degistirilebilir.
 *
 * Yetki Matrisi:
 *   Rol × Entity × Aksiyon (create/read/update/delete)
 *
 *   Ornek:
 *   | Rol            | Customer.create | Customer.read | Order.delete |
 *   |----------------|----------------|---------------|--------------|
 *   | admin          | ✓              | ✓             | ✓            |
 *   | sales_manager  | ✓              | ✓             | ✗            |
 *   | sales_rep      | ✗              | ✓             | ✗            |
 */

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';

export interface Role {
  id: string;
  name: string;
  description: string;
  tenant_id: string;
  is_system: boolean;
  created_at: Date;
}

export interface Permission {
  id: string;
  role_id: string;
  entity: string;
  action: 'create' | 'read' | 'update' | 'delete';
  allowed: boolean;
  tenant_id: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
const ALL_ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete'];

@Injectable()
export class RolesService {
  private readonly logger = new Logger('RolesService');
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();

  constructor() {
    // Varsayilan sistem rolleri (her tenant'ta otomatik olusur)
    this.createSystemRoles('default');
  }

  /** Varsayilan rolleri olustur */
  private createSystemRoles(tenant_id: string) {
    const systemRoles = [
      { name: 'admin', description: 'Tam yetki - tum islemleri yapabilir' },
      { name: 'manager', description: 'Yonetici - okuma + yazma yetkileri' },
      { name: 'user', description: 'Standart kullanici - sinirli yetkiler' },
      { name: 'viewer', description: 'Salt okunur erisim' },
    ];

    for (const r of systemRoles) {
      const id = crypto.randomUUID();
      this.roles.set(id, {
        id,
        name: r.name,
        description: r.description,
        tenant_id,
        is_system: true,
        created_at: new Date(),
      });

      // Admin icin tum yetkiler acik
      if (r.name === 'admin') {
        // Admin'e ozel: tum entity ve aksiyonlar icin yetki verilecek
        // Dinamik olarak entity kayit edildiginde eklenir
      }
    }
  }

  // ============================================================
  // ROL YONETIMI
  // ============================================================

  /** Yeni rol olustur */
  async createRole(data: { name: string; description: string; tenant_id: string }): Promise<Role> {
    // Ayni isimde rol var mi kontrol et
    const existing = Array.from(this.roles.values()).find(
      (r) => r.name === data.name && r.tenant_id === data.tenant_id,
    );
    if (existing) throw new ConflictException(`"${data.name}" rolu zaten mevcut`);

    const role: Role = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      tenant_id: data.tenant_id,
      is_system: false,
      created_at: new Date(),
    };

    this.roles.set(role.id, role);
    this.logger.log(`Rol olusturuldu: ${role.name} (${role.id})`);
    return role;
  }

  /** Tenant'a ait rolleri listele */
  async findRolesByTenant(tenant_id: string): Promise<Role[]> {
    return Array.from(this.roles.values()).filter((r) => r.tenant_id === tenant_id);
  }

  /** Rol sil (sistem rolleri silinemez) */
  async deleteRole(id: string): Promise<void> {
    const role = this.roles.get(id);
    if (!role) throw new NotFoundException('Rol bulunamadi');
    if (role.is_system) throw new ConflictException('Sistem rolleri silinemez');

    // Ilgili yetkileri de sil
    for (const [permId, perm] of this.permissions) {
      if (perm.role_id === id) this.permissions.delete(permId);
    }

    this.roles.delete(id);
  }

  // ============================================================
  // YETKI MATRISI
  // ============================================================

  /** Tek bir yetki ata/kaldir (matris hucresini toggle) */
  async setPermission(data: {
    role_id: string;
    entity: string;
    action: PermissionAction;
    allowed: boolean;
    tenant_id: string;
  }): Promise<Permission> {
    // Mevcut yetki var mi bak
    const existing = Array.from(this.permissions.values()).find(
      (p) => p.role_id === data.role_id && p.entity === data.entity && p.action === data.action,
    );

    if (existing) {
      existing.allowed = data.allowed;
      return existing;
    }

    const perm: Permission = {
      id: crypto.randomUUID(),
      role_id: data.role_id,
      entity: data.entity,
      action: data.action,
      allowed: data.allowed,
      tenant_id: data.tenant_id,
    };

    this.permissions.set(perm.id, perm);
    return perm;
  }

  /** Toplu yetki ata (bir rol icin tum entity yetkileri) */
  async setBulkPermissions(data: {
    role_id: string;
    permissions: { entity: string; actions: PermissionAction[] }[];
    tenant_id: string;
  }): Promise<void> {
    for (const perm of data.permissions) {
      for (const action of ALL_ACTIONS) {
        await this.setPermission({
          role_id: data.role_id,
          entity: perm.entity,
          action,
          allowed: perm.actions.includes(action),
          tenant_id: data.tenant_id,
        });
      }
    }
  }

  /** FSL permissions'dan varsayilan yetkileri yukle */
  async loadFromFSLDefaults(
    entity: string,
    fslPermissions: { create?: string[]; read?: string[]; update?: string[]; delete?: string[] },
    tenant_id: string,
  ): Promise<void> {
    const roles = await this.findRolesByTenant(tenant_id);

    for (const action of ALL_ACTIONS) {
      const allowedRoleNames = fslPermissions[action] || ['admin'];

      for (const role of roles) {
        await this.setPermission({
          role_id: role.id,
          entity,
          action,
          allowed: allowedRoleNames.includes(role.name),
          tenant_id,
        });
      }
    }
  }

  /** Bir rol icin tum yetkileri getir (matris satiri) */
  async getPermissionsByRole(role_id: string): Promise<Permission[]> {
    return Array.from(this.permissions.values()).filter((p) => p.role_id === role_id);
  }

  /** Bir entity icin tum yetkileri getir (matris sutunu) */
  async getPermissionsByEntity(entity: string, tenant_id: string): Promise<Permission[]> {
    return Array.from(this.permissions.values()).filter(
      (p) => p.entity === entity && p.tenant_id === tenant_id,
    );
  }

  /** Tam yetki matrisini getir (UI icin) */
  async getPermissionMatrix(tenant_id: string): Promise<{
    roles: Role[];
    entities: string[];
    matrix: Record<string, Record<string, Record<PermissionAction, boolean>>>;
  }> {
    const roles = await this.findRolesByTenant(tenant_id);
    const allPerms = Array.from(this.permissions.values()).filter(
      (p) => p.tenant_id === tenant_id,
    );

    // Benzersiz entity listesi
    const entities = [...new Set(allPerms.map((p) => p.entity))].sort();

    // Matris: { roleId: { entity: { create: true, read: false, ... } } }
    const matrix: Record<string, Record<string, Record<PermissionAction, boolean>>> = {};

    for (const role of roles) {
      matrix[role.id] = {};
      for (const entity of entities) {
        matrix[role.id][entity] = { create: false, read: false, update: false, delete: false };
      }
    }

    for (const perm of allPerms) {
      if (matrix[perm.role_id] && matrix[perm.role_id][perm.entity]) {
        matrix[perm.role_id][perm.entity][perm.action] = perm.allowed;
      }
    }

    return { roles, entities, matrix };
  }

  /** Kullanicinin belirli bir entity+action icin yetkisi var mi? */
  async hasPermission(
    userRoles: string[],
    entity: string,
    action: PermissionAction,
    tenant_id: string,
  ): Promise<boolean> {
    // Admin her zaman yetkili
    if (userRoles.includes('admin')) return true;

    const roles = await this.findRolesByTenant(tenant_id);
    const userRoleIds = roles.filter((r) => userRoles.includes(r.name)).map((r) => r.id);

    for (const roleId of userRoleIds) {
      const perm = Array.from(this.permissions.values()).find(
        (p) => p.role_id === roleId && p.entity === entity && p.action === action,
      );
      if (perm?.allowed) return true;
    }

    return false;
  }
}
