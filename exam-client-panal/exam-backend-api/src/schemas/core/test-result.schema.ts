import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Question } from '../exam-bank/question.schema';
import { QuestionSet } from '../exam-bank/question-set.schema';
import { User } from './user.schema';
import { Title } from '../exam-bank/title.schema';
import { Exam } from '../exam-bank/exam.schema';
import { Chapter } from '../exam-bank/chapter.schema';

@Schema()
class WeakAreaSchema {
  @Prop({ type: Types.ObjectId, ref: Chapter.name })
  chapterId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  wrongCount: number;
}

@Schema()
class TestDurationSchema {
  @Prop({ type: Number, required: true })
  timeTaken: number;

  @Prop({ type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;
}

@Schema({ timestamps: true })
export class TestResult {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: QuestionSet.name,
    required: true,
    index: true,
  })
  questionSetId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: Question.name }], default: [] })
  attemptedQuestions: Types.ObjectId[];

  @Prop({ type: Map, of: String })
  userAnswers: Map<string, string>;

  @Prop({ type: Map, of: Number })
  questionTimes: Map<string, number>;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  totalQuestions: number;

  @Prop({ required: true })
  correctAnswers: number;

  @Prop({ type: TestDurationSchema, required: true })
  testDuration: TestDurationSchema;

  @Prop({ enum: ['ongoing', 'completed', 'paused'], default: 'completed' })
  status: string;

  @Prop({ enum: ['title', 'exam', 'chapter', 'title-chapter', 'institute-chapter'], required: true })
  quizType: string;

  @Prop({ type: Types.ObjectId, ref: Title.name, index: true })
  titleId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Exam.name, index: true })
  examId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Chapter.name, index: true })
  chapterId?: Types.ObjectId;

  @Prop({ type: [WeakAreaSchema], default: [] })
  weakAreas?: WeakAreaSchema[];

  @Prop({ default: false })
  isReset: boolean;

  @Prop({ index: true })
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export type TestResultDocument = TestResult & Document;
export const TestResultSchema = SchemaFactory.createForClass(TestResult);
