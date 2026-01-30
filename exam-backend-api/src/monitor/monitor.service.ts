
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServerLog, ServerLogDocument } from '../schemas/core/server-log.schema';
import * as crypto from 'crypto';

@Injectable()
export class MonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitorService.name);
  private instanceId: string;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(
    @InjectModel(ServerLog.name) private serverLogModel: Model<ServerLogDocument>,
  ) {
    this.instanceId = crypto.randomUUID();
  }

  async onModuleInit() {
    this.logger.log(`Server starting... Instance ID: ${this.instanceId}`);
    
    // 1. Find previous session to calculate sleep time
    const lastLog = await this.serverLogModel.findOne().sort({ createdAt: -1 }).exec();
    
    let previousSleepDurationMs = 0;
    if (lastLog && lastLog.lastHeartbeat) {
      const now = new Date();
      const lastSeen = new Date(lastLog.lastHeartbeat);
      const diff = now.getTime() - lastSeen.getTime();
      
      // If gap is more than 2 minutes, assume it was sleeping/stopped
      // (1 min heartbeat + some buffer)
      if (diff > 120000) {
        previousSleepDurationMs = diff;
        this.logger.warn(`Server was down/sleeping for: ${previousSleepDurationMs / 1000} seconds`);
      }
    }

    // 2. Create new session log
    await this.serverLogModel.create({
      instanceId: this.instanceId,
      startTime: new Date(),
      lastHeartbeat: new Date(),
      previousSleepDurationMs,
      status: 'running'
    });

    // 3. Start Heartbeat (every 30 seconds)
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 30000);
  }

  async onModuleDestroy() {
    this.logger.log('Server stopping...');
    clearInterval(this.heartbeatInterval);
    
    await this.serverLogModel.findOneAndUpdate(
      { instanceId: this.instanceId },
      { 
        stopTime: new Date(),
        shutdownReason: 'Graceful Shutdown',
        lastHeartbeat: new Date(),
        status: 'stopped'
      }
    ).exec();
  }

  private async sendHeartbeat() {
    try {
      await this.serverLogModel.findOneAndUpdate(
        { instanceId: this.instanceId },
        { lastHeartbeat: new Date() }
      ).exec();
    } catch (err) {
      this.logger.error('Failed to update heartbeat', err);
    }
  }
}
