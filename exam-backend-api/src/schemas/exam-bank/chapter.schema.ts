import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Unit } from './unit.schema';
import { Exam } from './exam.schema';

// ✅ STEP 1: Nested classes BEFORE main class
class NameSchema {
  @Prop({ type: String, required: true })
  hi: string;

  @Prop({ type: String, required: true })
  en: string;
}

class DescriptionSchema {
  @Prop({ type: String })
  hi?: string;

  @Prop({ type: String })
  en?: string;
}

@Schema({ timestamps: true })
export class Chapter {
  @Prop({
    type: Types.ObjectId,
    ref: Unit.name,
    required: true,
    index: true,
  })
  unitId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: Exam.name,
    index: true,
  })
  examId?: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  })
  code: string;

  // ✅ FIXED: Use NameSchema class
  @Prop({ type: NameSchema, required: true })
  name: NameSchema;

  // ✅ FIXED: Use DescriptionSchema class
  @Prop({ type: DescriptionSchema })
  description?: DescriptionSchema;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  avgDifficulty: string;
}

export type ChapterDocument = Chapter & Document;
export const ChapterSchema = SchemaFactory.createForClass(Chapter);
