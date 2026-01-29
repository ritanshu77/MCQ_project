import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AttemptsService } from '../attempts/attempts.service';
import { BulkCreateQuestionsDto } from './dto/bulk-create-questions.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly attemptsService: AttemptsService,
  ) {}

  @Post('bulk')
  async bulkCreateQuestions(@Body() dto: BulkCreateQuestionsDto) {
    return await this.questionsService.bulkCreateQuestions(dto);
  }

  @Get()
  async getQuestions(
    @Query('examId') examId?: string,
    @Query('unitId') unitId?: string,
    @Query('chapterid') chapterid?: string,
    @Query('limit', ParseIntPipe) limit?: number,
    @Query('difficulty') difficulty?: string,
  ) {
    return await this.questionsService.getQuestions({
      examId,
      unitId,
      chapterid,
      limit: limit || 20,
      difficulty,
    });
  }

  @Get('questions')
  async getFilteredQuestions(
    @Query('unitId') unitId?: string,
    @Query('titleId') titleId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('difficulty') difficulty = 'all',
    @Query('search') search = '',
  ) {
    return this.questionsService.getQuestionsByFilters({
      unitId,
      titleId,
      subjectId,
      chapterId,
      page: parseInt(page),
      limit: parseInt(limit),
      difficulty,
      search,
    });
  }

  @Public()
  @Post('sets')
  async getQuestionSets(
    @Body()
    body: {
      titleId?: string;
      chapterId?: string;
      examId?: string;
      quizType?: string;
    },
  ) {
    const { titleId, chapterId, examId, quizType } = body;
    return this.questionsService.getQuestionSets({
      titleId,
      chapterId,
      examId,
      quizType,
    });
  }

  @Get('chapter/sets')
  @Get('chapter/sets/:chapterId')
  @Public()
  async createChapterSets(@Param('chapterId') chapterId?: string) {
    return this.questionsService.createSetsFromChapter(chapterId);
  }

  @Get('chapter/allsets/:chapterId')
  async getChapterSets(
    @Param('chapterId', ParseObjectIdPipe) chapterId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('activeOnly') activeOnly = 'false',
  ) {
    const result = await this.questionsService.getSetsByChapter(chapterId, {
      page: parseInt(page),
      limit: parseInt(limit),
      activeOnly: activeOnly === 'true',
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get('chapter/:chapterid')
  async getQuestionsByChapter(
    @Param('chapterid') chapterid: string,
    @Query('limit', ParseIntPipe) limit = 50,
  ) {
    return await this.questionsService.getQuestionsByChapter(chapterid, limit);
  }

  @Public()
  @Post('unit/allsets/:unitId')
  async getUnitSets(
    @Param('unitId', ParseObjectIdPipe) unitId: string,
    @Body()
    body: {
      page?: string;
      limit?: string;
      activeOnly?: string;
      titleId?: string;
      quizType?: string;
    },
    @Req() req: any,
  ) {
    const {
      page = '1',
      limit = '10',
      activeOnly = 'false',
      titleId,
      quizType,
    } = body;

    console.log(`[getUnitSets] Request for unit: ${unitId}`);
    console.log(
      `[getUnitSets] Auth User: ${req.user ? req.user.userId : 'None'}`,
    );

    const result = await this.questionsService.getSetsByUnit(unitId, {
      page: parseInt(page),
      limit: parseInt(limit),
      activeOnly: activeOnly === 'true',
      titleId,
      quizType,
    });

    const attemptsMap = new Map();

    if (req.user && req.user.userId) {
      const userId = req.user.userId;
      const allSets = (result.chapters as any[]).flatMap((c) => c.sets);
      const setIds = allSets.map((s) => s._id.toString());

      console.log(
        `[getUnitSets] Fetching attempts for user ${userId}, sets count: ${setIds.length}`,
      );
      const attempts = await this.attemptsService.getAttemptsForSets(
        userId,
        setIds,
      );
      console.log(`[getUnitSets] Found ${attempts.length} attempts`);

      attempts.forEach((a) => attemptsMap.set(a.questionSetId.toString(), a));
    }

    (result.chapters as any[]).forEach((c) => {
      c.sets.forEach((s: any) => {
        const attempt = attemptsMap.get(s._id.toString());
        if (attempt) {
          // Dynamic data from DB
          s.score = attempt.score;
          s.totalAttempted = attempt.attemptedQuestions?.length || 0;
          s.status = attempt.status;
          s.isOngoing = attempt.status === 'ongoing';
          if (s.totalQuestions > 0) {
            s.progress = Math.round(
              (s.totalAttempted / s.totalQuestions) * 100,
            );
          }

          // Return full attempt object + required fields
          const attemptObj = attempt.toObject ? attempt.toObject() : attempt;
          s.testResult = {
            ...attemptObj, // Include all DB fields
            _id: attempt._id,
            score: attempt.score,
            status: attempt.status,
            correctAnswers: attempt.correctAnswers,
            totalQuestions: attempt.totalQuestions,
            isReset: attempt.isReset || false,
          };
        } else {
          // Default structure (client expects this if not started)
          s.score = 0;
          s.totalAttempted = 0;
          s.progress = 0;
          s.status = 'not_started';
          s.testResult = {
            _id: null,
            score: 0,
            status: 'not_started',
            correctAnswers: 0,
            totalQuestions: s.totalQuestions || 0,
            isReset: false,
          };
        }
      });
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get('unit/:unitId')
  async getQuestionsByUnit(
    @Param('unitId') unitId: string,
    @Query('limit', ParseIntPipe) limit = 100,
  ) {
    return await this.questionsService.getQuestionsByUnit(unitId, limit);
  }

  @Post('sets/create/:titleId')
  async createSetsFromTitle(@Param('titleId') titleId: string) {
    return this.questionsService.createSetsFromTitle(titleId);
  }

  @Public()
  @Post('admin/generate-sets')
  async generateSets(@Body() body: any) {
    console.log('DEBUG: generateSets body:', body);
    try {
      const result = await this.questionsService.generateTitleChapterSets(
        body.titleId,
      );
      console.log('DEBUG: generateSets result:', result);
      return result;
    } catch (error) {
      console.error('DEBUG: generateSets error:', error);
      throw error;
    }
  }

  @Public()
  @Get('subjects/list')
  async getSubjectStatsComplete() {
    return this.questionsService.getSubjectStatsComplete();
  }

  @Public()
  @Get('subjects/list/:titleId')
  async getSubjectStatsCompleteByTitle(@Param('titleId') titleId: string) {
    return this.questionsService.getSubjectStatsComplete(titleId);
  }

  @Public()
  @Post('subjects/units')
  async getUnitsBySubject(
    @Body()
    body: {
      subjectId: string;
      titleId?: string;
      quizType?: string;
    },
    @Req() req?: any,
  ) {
    const { subjectId, titleId, quizType } = body;
    // 1. Get Base Data (Units -> Chapters -> Sets)
    const result = await this.questionsService.getUnitsBySubject(
      subjectId,
      titleId,
      quizType,
    );

    // 2. Attach User Progress
    if (req?.user?.userId) {
      const userId = req.user.userId;

      // Collect all sets to fetch attempts in one go
      const allSets: any[] = [];
      (result?.units as any[]).forEach((u) => {
        if (u.chapters) {
          u.chapters.forEach((c: any) => {
            if (c.sets) {
              c.sets.forEach((s: any) => allSets.push(s));
            }
          });
        }
      });

      if (allSets.length > 0) {
        const setIds = allSets.map((s) => s._id.toString());
        const attempts = await this.attemptsService.getAttemptsForSets(
          userId,
          setIds,
        );

        const attemptsMap = new Map();
        attempts.forEach((a) => attemptsMap.set(a.questionSetId.toString(), a));

        // Attach attempt data to sets
        (result?.units as any[]).forEach((u) => {
          if (u.chapters) {
            u.chapters.forEach((c: any) => {
              if (c.sets) {
                c.sets.forEach((s: any) => {
                  const attempt = attemptsMap.get(s._id.toString());
                  if (attempt) {
                    s.score = attempt.score;
                    s.totalAttempted = attempt.attemptedQuestions?.length || 0;
                    s.status = attempt.status;
                    s.isOngoing = attempt.status === 'ongoing';
                    if (s.totalQuestions > 0) {
                      s.progress = Math.round(
                        (s.totalAttempted / s.totalQuestions) * 100,
                      );
                    }
                    // Detailed result object as requested
                    s.testResult = {
                      _id: attempt._id,
                      score: attempt.score,
                      status: attempt.status,
                      correctAnswers: attempt.correctAnswers,
                      totalQuestions: attempt.totalQuestions,
                      isReset: attempt.isReset || false,
                    };
                  } else {
                    s.score = 0;
                    s.totalAttempted = 0;
                    s.progress = 0;
                    s.status = 'not_started';
                  }
                });
              }
            });
          }
        });
      }
    }

    return result;
  }

  @Public()
  @Get('subjects/:subjectId')
  async getSubjectById(
    @Param('subjectId', ParseObjectIdPipe) subjectId: string,
  ) {
    const subject = await this.questionsService.getSubjectById(subjectId);

    return {
      success: true,
      data: subject,
    };
  }

  @Public()
  @Get('set/:setId')
  async getQuestionsBySetId(@Param('setId', ParseObjectIdPipe) setId: string) {
    const result = await this.questionsService.getQuestionsBySetId(setId);

    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Get('titles/list')
  async getTitlesList() {
    const titles = await this.questionsService.getTitlesList();
    return {
      success: true,
      titles,
    };
  }

  @Public()
  @Get('exams/list')
  async getExamsList() {
    const exams = await this.questionsService.getExamsList();
    return {
      success: true,
      exams,
    };
  }

  @Get(':id')
  async getQuestion(@Param('id') id: string) {
    return await this.questionsService.findOne(id);
  }
}
