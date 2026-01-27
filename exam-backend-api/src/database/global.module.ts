import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ✅ ALL YOUR EXISTING SCHEMAS - YAHAN IMPORT

import { Exam, ExamSchema } from '../schemas/exam-bank/exam.schema';
import { Chapter, ChapterSchema } from '../schemas/exam-bank/chapter.schema';
import { Question, QuestionSchema } from '../schemas/exam-bank/question.schema';
import {
  TestResult,
  TestResultSchema,
} from 'src/schemas/core/test-result.schema';
import { User, UserSchema } from 'src/schemas/core/user.schema';
import { Unit, UnitSchema } from 'src/schemas/exam-bank/unit.schema';
import { Title, TitleSchema } from 'src/schemas/exam-bank/title.schema';
import { Subject, SubjectSchema } from 'src/schemas/exam-bank/subject.schema';
import {
  QuestionSet,
  QuestionSetSchema,
} from 'src/schemas/exam-bank/question-set.schema';

@Global() // 🔥 GLOBAL - Everywhere access!
@Module({
  imports: [
    MongooseModule.forFeature([
      // core schemas
      { name: User.name, schema: UserSchema },
      { name: TestResult.name, schema: TestResultSchema },
      // exam bank schemas
      { name: Title.name, schema: TitleSchema },
      { name: Exam.name, schema: ExamSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Chapter.name, schema: ChapterSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuestionSet.name, schema: QuestionSetSchema },
    ]),
  ],
  exports: [MongooseModule], // 🔥 Export for all modules
})
export class GlobalDatabaseModule {}
