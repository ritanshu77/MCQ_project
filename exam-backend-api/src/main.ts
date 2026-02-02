import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { Request, Response } from 'express';

// Set Timezone to India Standard Time (IST)
process.env.TZ = 'Asia/Kolkata';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Trust proxy for Throttler (Render/Cloudflare etc)
  app.set('trust proxy', 1);

  // Enable graceful shutdown
  app.enableShutdownHooks();

  app.use(cookieParser());

  // FIXED CORS - COMPLETE CONFIG
  app.enableCors({
    // Setting origin: true allows ANY domain to access the API while still allowing credentials (cookies).
    // This effectively bypasses strict CORS checks for all origins.
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Exam Bank API')
    .setDescription('MCQ Exam Questions API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  //  CRITICAL: Use Express adapter for direct routes
  const httpAdapter = app.getHttpAdapter();

  // Root endpoint
  httpAdapter.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Exam Bank API',
      version: '1.0',
      docs: '/api',
      health: '/health',
    });
  });

  // IMPORTANT: Backend must NOT use the main 'PORT' variable in cloud because Frontend uses it.
  // We force Backend to run on 3001 (or specific BACKEND_PORT) internally.
  const port = process.env.BACKEND_PORT || 3001;

  await app.listen(port, '0.0.0.0', () => {
    console.log(` Server running on port: ${port}`);
    console.log(` Access via: http://0.0.0.0:${port}`);
    console.log(` Swagger docs: http://0.0.0.0:${port}/api`);
    console.log(` Health check: http://0.0.0.0:${port}/health`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Server Time: ${new Date().toString()}`);
  });
}

bootstrap();
