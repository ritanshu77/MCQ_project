import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionsModule } from './questions/questions.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AttemptsModule } from './attempts/attempts.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import config from './config/config';
import databaseConfig from './config/database.config';
import { GlobalDatabaseModule } from './database/global.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth/jwt-auth.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { MonitorModule } from './monitor/monitor.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    //  Rate Limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    //  Load ALL custom config files globally
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config, databaseConfig], // Custom config files
      envFilePath: '.env',
    }),

    //  Use config from custom file
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const baseUri = configService.get<string>('database.uri')!;
        const dbName = configService.get<string>('database.dbName')!;

        // Console logs - DB details
        console.log(' MongoDB Base URI:', baseUri);
        console.log(' Database Name:', dbName);

        return {
          uri: baseUri,
          dbName: dbName, // Explicitly pass dbName to Mongoose options
          connectionName: configService.get<string>('database.connectionName'),
          connectionFactory: (connection: any) => {
            if (connection.readyState === 1) {
              console.log('MONGODB IS CONNECTED');
            }
            connection.on('connected', () => {
              console.log('MONGODB IS CONNECTED');
            });
            console.log(' MongoDB Connected!');
            console.log(
              ' DB Name:',
              connection.db ? connection.db.databaseName : 'Unknown',
            );
            console.log(' Host:', connection.host);
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    GlobalDatabaseModule,
    QuestionsModule,
    DatabaseModule,
    AuthModule,
    AttemptsModule,
    MonitorModule,
    FeedbackModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
