import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { QuestionFeedback, QuestionFeedbackSchema } from '../schemas/core/question-feedback.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionFeedback.name, schema: QuestionFeedbackSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
