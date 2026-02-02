import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Question } from '../exam-bank/question.schema';

export type QuestionFeedbackDocument = QuestionFeedback & Document;

@Schema({ timestamps: true })
export class QuestionFeedback {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Question.name, required: true, index: true })
  questionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  feedback: string;

  @Prop({
    enum: ['pending', 'reviewed', 'resolved', 'ignored'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ trim: true })
  adminComment?: string;
}

export const QuestionFeedbackSchema = SchemaFactory.createForClass(QuestionFeedback);
