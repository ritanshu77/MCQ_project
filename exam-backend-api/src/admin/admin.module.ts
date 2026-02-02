import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../schemas/core/user.schema';
import { Question, QuestionSchema } from '../schemas/exam-bank/question.schema';
import { QuestionFeedback, QuestionFeedbackSchema } from '../schemas/core/question-feedback.schema';
import { Admin, AdminSchema } from '../schemas/core/admin.schema';
import { TestResult, TestResultSchema } from '../schemas/core/test-result.schema';
import { Subject, SubjectSchema } from '../schemas/exam-bank/subject.schema';
import { Unit, UnitSchema } from '../schemas/exam-bank/unit.schema';
import { Chapter, ChapterSchema } from '../schemas/exam-bank/chapter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: QuestionFeedback.name, schema: QuestionFeedbackSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: TestResult.name, schema: TestResultSchema },
      { name: Subject.name, schema: SubjectSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Chapter.name, schema: ChapterSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtSecret') || 'secretKey', // Fallback for dev
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
