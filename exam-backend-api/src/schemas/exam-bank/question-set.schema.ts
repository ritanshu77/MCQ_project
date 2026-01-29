import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NameSchema } from '../types/bilingual.types';
import { Question } from './question.schema';
import { Chapter } from './chapter.schema';
import { Title } from './title.schema';
import { Unit } from './unit.schema';
import { Exam } from './exam.schema';

class StatsSchema {
  @Prop({ type: Number, default: 0 })
  avgScore: number;

  @Prop({ type: Number, default: 0 })
  totalAttempts: number;
}

@Schema({ timestamps: true })
export class QuestionSet {
  @Prop({ type: Types.ObjectId, ref: Title.name, required: false, index: true })
  titleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Exam.name, required: false, index: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Unit.name, required: false, index: true })
  unitId: Types.ObjectId; // ✅ NEW - "DBMS500"

  @Prop({
    type: Types.ObjectId,
    ref: Chapter.name,
    required: false,
    index: true,
  })
  chapterId: Types.ObjectId; // ✅ Chapter reference

  @Prop({ type: NameSchema, required: true })
  name: NameSchema; // Auto: "DBMS500 - SQL - Set 1"

  @Prop({
    type: [{ type: Types.ObjectId, ref: Question.name }],
    required: true,
  })
  questionIds: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 1 })
  totalQuestions: number;

  @Prop({ type: Number, default: 0 })
  setNumber: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: StatsSchema })
  stats?: StatsSchema;

  // ✅ YE FIELD ADD KARO
  @Prop({
    enum: ['title', 'chapter', 'exam', 'practice', 'unit'],
    default: 'title',
    required: true,
  })
  quizType: string; // title/chapter/exam/practice
}

export type QuestionSetDocument = QuestionSet & Document;
export const QuestionSetSchema = SchemaFactory.createForClass(QuestionSet);
