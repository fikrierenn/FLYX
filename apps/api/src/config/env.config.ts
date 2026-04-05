/**
 * Ortam Degiskeni Konfigurasyonu
 * ================================
 * Tum ortam degiskenlerini merkezi olarak yonetir.
 * Eksik degiskenler icin varsayilan degerler saglar.
 */

export const envConfig = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flyx',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  logLevel: process.env.LOG_LEVEL || 'debug',
});

export type EnvConfig = ReturnType<typeof envConfig>;
