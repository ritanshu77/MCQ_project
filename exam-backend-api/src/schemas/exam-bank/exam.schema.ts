import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NameSchema } from '../types/bilingual.types';
// ✅ STEP 1: Nested Schema Classes banao
// class NameSchema {
//   @Prop({ type: String, required: true })
//   hi: string;

//   @Prop({ type: String, required: true })
//   en: string;
// }

@Schema({ timestamps: true })
export class Exam {
  @Prop({
    required: true,
    // unique: true,
    // uppercase: true,
    index: true,
  })
  code: string;

  // ✅ STEP 2: Schema class use karo
  @Prop({ type: NameSchema, required: true })
  name: NameSchema;

  @Prop({ required: true, index: true })
  year: number;

  @Prop({ default: true })
  isActive: boolean;
}

export type ExamDocument = Exam & Document;
export const ExamSchema = SchemaFactory.createForClass(Exam);
