import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

// Set Timezone to India Standard Time (IST)
process.env.TZ = 'Asia/Kolkata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.use(cookieParser());

  // FIXED CORS - COMPLETE CONFIG
  app.enableCors({
    origin: [
      "https://exam-bank-web-frontend.onrender.com",
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://172.19.160.1:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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
  
  // Health check endpoint for Render (no authentication needed)
  httpAdapter.get('/health', (req, res) => {
    console.log(`[Health Check] Ping received from ${req.headers.origin || 'unknown origin'} at ${new Date().toISOString()}`);
    res.json({ 
      status: 'OK', 
      service: 'Exam Bank API',
      timestamp: new Date().toString(),
      timezone: process.env.TZ,
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Root endpoint
  httpAdapter.get('/', (req, res) => {
    res.json({ 
      message: 'Exam Bank API',
      version: '1.0',
      docs: '/api',
      health: '/health'
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
