import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { QuestionFeedback, QuestionFeedbackSchema } from '../schemas/core/question-feedback.schema';
import { Question, QuestionSchema } from '../schemas/exam-bank/question.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionFeedback.name, schema: QuestionFeedbackSchema },
      { name: Question.name, schema: QuestionSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
