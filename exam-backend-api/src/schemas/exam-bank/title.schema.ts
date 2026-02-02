import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NameSchema } from '../types/bilingual.types';

class DescriptionSchema {
  @Prop({ type: String }) hi?: string;
  @Prop({ type: String }) en?: string;
}

@Schema({ timestamps: true })
export class Title {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ type: NameSchema, required: true })
  name: NameSchema;

  @Prop({ type: DescriptionSchema })
  description?: DescriptionSchema;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  totalQuestions: number;
}

// ✅ YE 2 LINES ADD KARO
export type TitleDocument = Title & Document;
export const TitleSchema = SchemaFactory.createForClass(Title);
