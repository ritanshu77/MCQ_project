import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NameSchema } from '../types/bilingual.types';

class DescriptionSchema {
  @Prop({ type: String })
  hi?: string;

  @Prop({ type: String })
  en?: string;
}

@Schema({ timestamps: true })
export class Subject {
  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  })
  code: string; // "CS", "HISTORY", "MATHS"

  @Prop({ type: NameSchema, required: true })
  name: NameSchema; // { hi: "कंप्यूटर विज्ञान", en: "Computer Science" }

  @Prop({ type: DescriptionSchema })
  description?: DescriptionSchema;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  totalUnits: number; // Number of units under this subject

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  avgDifficulty: string;
}

export type SubjectDocument = Subject & Document;
export const SubjectSchema = SchemaFactory.createForClass(Subject);
