import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';
import { NameSchema } from '../types/bilingual.types';
import { Unit } from './unit.schema';
import { Exam } from './exam.schema';
import { Chapter } from './chapter.schema';
import { Title } from './title.schema';
import { Subject } from './subject.schema';
// class NameSchema {
//   @Prop({ type: String, required: true })
//   hi: string;

//   @Prop({ type: String, required: true })
//   en: string;
// }

class OptionSchema {
  @Prop({ type: String, required: true, enum: ['A', 'B', 'C', 'D', 'E'] })
  key: string;

  @Prop({ type: NameSchema, required: true })
  text: NameSchema;
}

class ExplanationSchema {
  @Prop({ type: String })
  hi?: string;

  @Prop({ type: String })
  en?: string;
}

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: Title.name, index: true })
  titleId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Exam.name, index: true })
  examId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Subject.name, index: true })
  subjectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Unit.name, index: true })
  unitId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Chapter.name, index: true })
  chapterId?: Types.ObjectId;

  @Prop({ type: NameSchema, required: true })
  questionText: NameSchema;

  @Prop({ type: [OptionSchema], required: true })
  options: OptionSchema[];

  @Prop({ required: true, enum: ['A', 'B', 'C', 'D', 'E'] })
  correctOptionKey: string;

  @Prop({ type: ExplanationSchema })
  explanation?: ExplanationSchema;

  @Prop({ type: Number, min: 1 })
  questionNumber: number;

  @Prop({ default: false })
  isPreviousYear: boolean;

  @Prop({ type: String })
  previousExamCode?: string;

  @Prop({ enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty: string;

  @Prop({ enum: ['active', 'inactive', 'draft'], default: 'active' })
  status: string;
}

export type QuestionDocument = Question & Document;
export const QuestionSchema = SchemaFactory.createForClass(Question);
