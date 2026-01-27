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

@Module({
  imports: [
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
        const fullUri = `${baseUri}/${dbName}`;

        //  Console logs - DB details
        console.log(' MongoDB Base URI:', baseUri);
        console.log(' Database Name:', dbName);
        console.log(' Full Connection URI:', fullUri);

        return {
          uri: fullUri,
          connectionName: configService.get<string>('database.connectionName'),
          connectionFactory: (connection: any) => {
            if (connection.readyState === 1) {
              console.log('MONGODB IS COONECT ' + fullUri);
            }
            connection.on('connected', () => {
              console.log('MONGODB IS COONECT ' + fullUri);
            });
            console.log(' MongoDB Connected!');
            console.log(' DB Name:', connection.db.databaseName);
            console.log(' Host:', connection.host);
            console.log(' Full URI Used:', fullUri);
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
