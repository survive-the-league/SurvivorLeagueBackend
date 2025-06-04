import { env } from './env';

export const JWT_CONFIG = {
  secret: env.jwt.secret || 'your-secret-key',
  expiresIn: '24h' as const,
  refreshExpiresIn: '7d' as const
}; 