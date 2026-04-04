/**
 * FLYX Platform - Özel Decorator'lar
 * ====================================
 * Controller method'larına metadata ekleyen decorator fonksiyonları.
 * Guard'lar (JwtAuthGuard, RolesGuard) bu metadata'yı okuyarak karar verir.
 */

import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './guards/jwt-auth.guard';
import { ROLES_KEY } from './guards/roles.guard';

/**
 * Route'u herkese açık yapar (JWT doğrulama atlanır).
 * Kullanım: @Public() → login endpoint gibi auth gerektirmeyen yerler
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Route'a rol kısıtlaması ekler.
 * Kullanım: @Roles('admin', 'manager') → sadece bu roller erişebilir
 * FSL'deki permissions bloğundan otomatik üretilir.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
