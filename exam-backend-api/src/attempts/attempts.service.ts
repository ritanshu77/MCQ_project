import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TestResult } from '../schemas/core/test-result.schema';
import { Question } from '../schemas/exam-bank/question.schema';
import { QuestionSet } from '../schemas/exam-bank/question-set.schema';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectModel(TestResult.name) private testResultModel: Model<TestResult>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(QuestionSet.name) private questionSetModel: Model<QuestionSet>,
  ) {}

  async saveProgress(data: any) {
    const {
      userId,
      questionSetId,
      questionId,
      answerKey,
      questionTime,
      totalTime,
    } = data;

    // Find existing attempt or create new
    let attempt = await this.testResultModel.findOne({
      userId: new Types.ObjectId(userId),
      questionSetId: new Types.ObjectId(questionSetId),
      status: 'ongoing',
      // isReset: { $ne: true }, // ⭐ REMOVE this line if 'isReset' is not in schema
    });

    if (!attempt) {
      const set = await this.questionSetModel.findById(questionSetId);
      const totalQ = set?.totalQuestions || 0;
      const qType = set?.quizType || 'title';
      const tId = set?.titleId ? new Types.ObjectId(set.titleId) : undefined;
      const cId = set?.chapterId
        ? new Types.ObjectId(set.chapterId)
        : undefined;
      // const eId = set?.examId ? new Types.ObjectId(set.examId as string) : undefined;

      attempt = new this.testResultModel({
        userId: new Types.ObjectId(userId),
        questionSetId: new Types.ObjectId(questionSetId),
        status: 'ongoing',
        userAnswers: {},
        // questionTimes: {}, // ⭐ REMOVE if not in schema
        score: 0,
        correctAnswers: 0,
        totalQuestions: totalQ,
        quizType: qType,
        titleId: tId,
        chapterId: cId,
        // examId: eId,
        weakAreas: [],
        testDuration: {
          startTime: new Date(),
          endTime: new Date(),
          timeTaken: 0,
        },
      });
    }

    // 1. Fetch Question Details for Scoring
    const question = await this.questionModel.findById(questionId);
    if (!question) {
      // Should not happen, but safe fallback
      return await attempt.save();
    }

    const qAny = question as any;
    const correctKey =
      qAny.correctOptionKey || qAny.correctOption || qAny.correctAnswer;
    // const chapterId = question.chapterDetails?._id || question.chapterId;

    // 2. Determine Previous State
    let oldAnswer: string | null = null;
    if (attempt.userAnswers instanceof Map) {
      oldAnswer = attempt.userAnswers.get(questionId) || null;
    } else {
      // @ts-ignore
      oldAnswer = attempt.userAnswers ? attempt.userAnswers[questionId] : null;
    }

    // 3. Update Answers & Time
    if (!attempt.userAnswers) attempt.userAnswers = new Map();
    if (attempt.userAnswers instanceof Map) {
      attempt.userAnswers.set(questionId, answerKey);
    } else {
      (attempt.userAnswers as any)[questionId] = answerKey;
    }

    // Update Attempted Questions Array
    const qIdObj = new Types.ObjectId(questionId);
    const alreadyAttempted = attempt.attemptedQuestions.some(
      (id) => id.toString() === questionId,
    );
    if (!alreadyAttempted) {
      attempt.attemptedQuestions.push(qIdObj);
    }

    // 4. Calculate Score Delta
    const getScore = (ans: string | null) => {
      if (!ans) return 0;
      return ans === correctKey ? 1 : -0.33; // Negative marking
    };

    const oldScore = getScore(oldAnswer);
    const newScore = getScore(answerKey);

    // Initialize score if undefined
    if (attempt.score === undefined) attempt.score = 0;

    attempt.score = attempt.score - oldScore + newScore;

    // Fix floating point precision
    attempt.score = Math.round(attempt.score * 100) / 100;

    // Update correct count
    if (attempt.correctAnswers === undefined) attempt.correctAnswers = 0;
    if (oldScore > 0) attempt.correctAnswers--;
    if (newScore > 0) attempt.correctAnswers++;

    // 5. Update Weak Areas
    // if (chapterId) {
    //   // ... logic for weak areas ...
    // }

    // TODO: Store questionTime somewhere if schema allows (currently TestResult doesn't have per-question time)
    // For now we just update total duration
    if (attempt.testDuration) {
      attempt.testDuration.timeTaken = totalTime;
    } else {
      attempt.testDuration = {
        startTime: new Date(),
        endTime: new Date(),
        timeTaken: totalTime,
      };
    }

    attempt.markModified('userAnswers');
    attempt.markModified('testDuration');

    return await attempt.save();
  }

  async getProgress(userId: string, questionSetId: string) {
    const attempt = await this.testResultModel.findOne({
      userId: new Types.ObjectId(userId),
      questionSetId: new Types.ObjectId(questionSetId),
      status: 'ongoing',
      isReset: { $ne: true },
    });

    if (!attempt) return null;

    return {
      userAnswers: attempt.userAnswers,
      questionTimes: attempt.questionTimes, // Added
      testDuration: attempt.testDuration,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
    };
  }

  async getAttemptsForSets(userId: string, setIds: string[]) {
    return await this.testResultModel.find({
      userId: new Types.ObjectId(userId),
      questionSetId: { $in: setIds.map((id) => new Types.ObjectId(id)) },
      isReset: { $ne: true },
    });
  }

  async getHistory(
    userId: string,
    filters: {
      quizType?: string;
      titleId?: string;
      chapterId?: string;
      status?: string;
    },
  ) {
    const query: any = {
      userId: new Types.ObjectId(userId),
      isReset: { $ne: true },
    };

    if (filters.quizType) query.quizType = filters.quizType;
    if (filters.titleId) query.titleId = new Types.ObjectId(filters.titleId);
    if (filters.chapterId)
      query.chapterId = new Types.ObjectId(filters.chapterId);
    if (filters.status) query.status = filters.status;

    return await this.testResultModel
      .find(query)
      .populate('questionSetId', 'name totalQuestions')
      .populate('titleId', 'name')
      .populate('chapterId', 'name')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async resetProgress(userId: string, questionSetId: string) {
    // Find any non-reset attempt (ongoing or completed)
    const attempts = await this.testResultModel.find({
      userId: new Types.ObjectId(userId),
      questionSetId: new Types.ObjectId(questionSetId),
      isReset: { $ne: true },
    });

    for (const attempt of attempts) {
      attempt.isReset = true;
      attempt.status = 'completed'; // Force completion to allow new attempt
      await attempt.save();
    }
    return { success: true };
  }
}
