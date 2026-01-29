import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import {
  TestResult,
  TestResultSchema,
} from '../schemas/core/test-result.schema';
import { Question, QuestionSchema } from '../schemas/exam-bank/question.schema';

import {
  QuestionSet,
  QuestionSetSchema,
} from '../schemas/exam-bank/question-set.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TestResult.name, schema: TestResultSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuestionSet.name, schema: QuestionSetSchema }, // ⭐ Added
    ]),
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
