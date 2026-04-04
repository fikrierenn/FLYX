/**
 * Tenant (Kiracı) Middleware
 * =========================
 * Multi-tenant mimarisinin temel taşı. Her HTTP isteğine tenant bağlamı ekler.
 *
 * Çalışma mantığı:
 * 1. Önce X-Tenant-ID header'ını kontrol eder (API istemcileri için)
 * 2. Yoksa subdomain'den tenant slug'ını çıkarır (acme.flyx.app → "acme")
 * 3. Tenant ID'yi request nesnesine ekler → sonraki guard/controller'lar kullanır
 *
 * Neden bu sıra?
 * - API istemcileri (Postman, mobil app) subdomain kullanmayabilir, header daha esnek
 * - Web tarayıcı kullanıcıları ise subdomain üzerinden otomatik çözümlenir
 *
 * Üretimde yapılacak:
 * - slug → tenant_id dönüşümü veritabanından çözülecek
 * - Tenant bulunamazsa 404 döndürülecek
 * - Tenant durumu (aktif/askıda) kontrol edilecek
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/** Express Request'i tenant bilgisiyle genişleten arayüz */
export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSlug?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, _res: Response, next: NextFunction) {
    // 1. Öncelik: X-Tenant-ID header'ı (API istemcileri için)
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      req.tenantId = headerTenantId;
      next();
      return;
    }

    // 2. Subdomain'den tenant çözümle (acme.flyx.app → "acme")
    const host = req.hostname;
    const parts = host.split('.');

    if (parts.length >= 2) {
      const slug = parts[0];
      // Sistem subdomain'lerini atla (www, api, app, localhost tenant değil)
      if (!['www', 'api', 'app', 'localhost'].includes(slug)) {
        req.tenantSlug = slug;
        // TODO: Üretimde slug → tenant_id veritabanından çözümlenecek
        req.tenantId = slug;
      }
    }

    next();
  }
}
