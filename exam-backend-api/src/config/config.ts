import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt((process.env.PORT as string) || '3001'),
  jwtSecret: process.env.JWT_SECRET || 'secret123',
  nodeEnv: process.env.NODE_ENV || 'development',
}));

// Export all configs
// export { databaseConfig };
