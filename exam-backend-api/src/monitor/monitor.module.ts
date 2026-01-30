
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitorService } from './monitor.service';
import { ServerLog, ServerLogSchema } from '../schemas/core/server-log.schema';
import { MonitorController } from './monitor.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ServerLog.name, schema: ServerLogSchema }]),
  ],
  controllers: [MonitorController],
  providers: [MonitorService],
  exports: [MonitorService],
})
export class MonitorModule {}
