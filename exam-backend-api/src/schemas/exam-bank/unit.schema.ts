import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import { NameSchema } from '../types/bilingual.types';
import { Subject } from './subject.schema';
// class NameSchema {
//   @Prop({ type: String, required: true })
//   hi: string;

//   @Prop({ type: String, required: true })
//   en: string;
// }

class DescriptionSchema {
  @Prop({ type: String })
  hi?: string;

  @Prop({ type: String })
  en?: string;
}

@Schema({ timestamps: true })
export class Unit {
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  code: string;

  @Prop({
    type: Types.ObjectId,
    ref: Subject.name, // ✅ Reference to Subject
    required: true,
    index: true,
  })
  subjectId: Types.ObjectId; // ✅ YE FIELD MISSING THA!
  @Prop({ type: NameSchema, required: true })
  name: NameSchema;

  @Prop({ type: DescriptionSchema })
  description?: DescriptionSchema;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  totalChapters: number;

  @Prop({ default: 0 })
  totalQuestions: number;
}

export type UnitDocument = Unit & Document;
export const UnitSchema = SchemaFactory.createForClass(Unit);
