import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({
    type: String,
    sparse: true,
  })
  mobile?: string;

  @Prop({
    type: String,
    sparse: true,
  })
  gmail?: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ index: true })
  browserId?: string;

  @Prop({
    type: [
      {
        deviceId: { type: String, required: true },
        lastActive: { type: Date, default: Date.now },
        totalTime: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  sessions: Array<{
    deviceId: string;
    lastActive: Date;
    totalTime: number;
  }>;

  @Prop({ enum: ['guest', 'registered'], default: 'guest' })
  type: string;

  // @Prop({ default: 0 })
  // totalTests: number;

  @Prop({ default: 0 })
  totalTimeSpent: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
