/**
 * Kullanici Servisi
 * ==================
 * Kullanici CRUD islemleri, sifre hashleme, rol yonetimi.
 * DatabaseService ile PostgreSQL'e baglanir.
 */

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.module';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  roles: string[];
  status: 'active' | 'inactive' | 'suspended';
  tenant_id: string;
  created_at: Date;
}

export type SafeUser = Omit<User, 'password_hash'>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');
  private readonly SALT_ROUNDS = 12;

  // In-memory store (DB yokken calisir)
  private users: Map<string, User> = new Map();

  constructor(private readonly db: DatabaseService) {}

  /** Sifre hashle (bcrypt) */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /** Sifre dogrula */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /** Kullanici olustur */
  async create(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    roles?: string[];
    tenant_id: string;
  }): Promise<SafeUser> {
    // Email benzersizlik kontrolu
    const existing = Array.from(this.users.values()).find(
      (u) => u.email === data.email && u.tenant_id === data.tenant_id,
    );
    if (existing) {
      throw new ConflictException('Bu email adresi zaten kayitli');
    }

    const id = crypto.randomUUID();
    const password_hash = await this.hashPassword(data.password);

    const user: User = {
      id,
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      roles: data.roles || ['user'],
      status: 'active',
      tenant_id: data.tenant_id,
      created_at: new Date(),
    };

    this.users.set(id, user);
    this.logger.log(`Kullanici olusturuldu: ${data.email} (${id})`);

    return this.toSafe(user);
  }

  /** Email ile kullanici bul (login icin) */
  async findByEmail(email: string, tenant_id: string): Promise<User | null> {
    return Array.from(this.users.values()).find(
      (u) => u.email === email && u.tenant_id === tenant_id,
    ) || null;
  }

  /** ID ile kullanici bul */
  async findById(id: string): Promise<SafeUser | null> {
    const user = this.users.get(id);
    return user ? this.toSafe(user) : null;
  }

  /** Tenant'a ait tum kullanicilari listele */
  async findByTenant(tenant_id: string): Promise<SafeUser[]> {
    return Array.from(this.users.values())
      .filter((u) => u.tenant_id === tenant_id)
      .map((u) => this.toSafe(u));
  }

  /** Kullanici rollerini guncelle */
  async updateRoles(id: string, roles: string[]): Promise<SafeUser> {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('Kullanici bulunamadi');
    user.roles = roles;
    return this.toSafe(user);
  }

  /** Sifre degistir */
  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('Kullanici bulunamadi');
    user.password_hash = await this.hashPassword(newPassword);
  }

  /** password_hash'i cikart */
  private toSafe(user: User): SafeUser {
    const { password_hash, ...safe } = user;
    return safe;
  }
}
