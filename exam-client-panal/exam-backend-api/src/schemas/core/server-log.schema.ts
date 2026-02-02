
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServerLogDocument = ServerLog & Document;

@Schema({ timestamps: true })
export class ServerLog {
  @Prop({ required: true })
  instanceId: string;

  @Prop({ required: true, index: true })
  startTime: Date;

  @Prop()
  lastHeartbeat: Date;

  @Prop()
  stopTime: Date;

  @Prop()
  shutdownReason: string;

  @Prop()
  previousSleepDurationMs: number; // Time slept before this instance started

  @Prop()
  status: string;
}

export const ServerLogSchema = SchemaFactory.createForClass(ServerLog);
