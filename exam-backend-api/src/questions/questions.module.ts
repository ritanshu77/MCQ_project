import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Exam, ExamSchema } from '../schemas/exam-bank/exam.schema';

import { Chapter, ChapterSchema } from '../schemas/exam-bank/chapter.schema';
import { Question, QuestionSchema } from '../schemas/exam-bank/question.schema';
import { Unit, UnitSchema } from 'src/schemas/exam-bank/unit.schema';
import {
  QuestionSet,
  QuestionSetSchema,
} from 'src/schemas/exam-bank/question-set.schema';
import { Subject, SubjectSchema } from 'src/schemas/exam-bank/subject.schema';
import { Title, TitleSchema } from 'src/schemas/exam-bank/title.schema';
import { AttemptsModule } from '../attempts/attempts.module';

@Module({
  imports: [
    AttemptsModule,
    MongooseModule.forFeature([
      { name: Title.name, schema: TitleSchema }, //  NEW
      { name: Exam.name, schema: ExamSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuestionSet.name, schema: QuestionSetSchema },
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
