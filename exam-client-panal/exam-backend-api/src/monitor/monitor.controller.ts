
import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServerLog, ServerLogDocument } from '../schemas/core/server-log.schema';

@Controller('monitor')
export class MonitorController {
  constructor(
    @InjectModel(ServerLog.name) private serverLogModel: Model<ServerLogDocument>,
  ) {}

  @Get('stats')
  async getStats() {
    const logs = await this.serverLogModel.find().sort({ createdAt: -1 }).limit(10).exec();
    return {
      success: true,
      data: logs.map(log => {
        const uptime = log.lastHeartbeat ? (new Date(log.lastHeartbeat).getTime() - new Date(log.startTime).getTime()) : 0;
        return {
            startTime: log.startTime,
            lastHeartbeat: log.lastHeartbeat,
            uptimeSeconds: uptime / 1000,
            sleepDurationSeconds: log.previousSleepDurationMs ? log.previousSleepDurationMs / 1000 : 0,
            stopTime: log.stopTime,
            shutdownReason: log.shutdownReason
        };
      })
    };
  }
}
