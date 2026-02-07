import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuestionFeedback, QuestionFeedbackDocument } from '../schemas/core/question-feedback.schema';
import { Question, QuestionDocument } from '../schemas/exam-bank/question.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(QuestionFeedback.name)
    private feedbackModel: Model<QuestionFeedbackDocument>,
    @InjectModel(Question.name)
    private questionModel: Model<QuestionDocument>,
  ) {}

  async createFeedback(userId: string, questionId: string, feedback: string) {
    const newFeedback = new this.feedbackModel({
      userId: new Types.ObjectId(userId),
      questionId: new Types.ObjectId(questionId),
      feedback,
      status: 'pending',
    });
    return await newFeedback.save();
  }

  async getFeedbacks(query: any = {}) {
    const filter: any = {};

    // Filter by status
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    // Filter by search (feedback text or question text)
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      
      // Find matching questions first
      const matchingQuestions = await this.questionModel.find({
        $or: [
          { 'questionText.en': searchRegex },
          { 'questionText.hi': searchRegex },
        ]
      }).select('_id');

      const questionIds = matchingQuestions.map(q => q._id);

      filter.$or = [
        { feedback: searchRegex },
        { questionId: { $in: questionIds } }
      ];
    }

    // Sort
    const sortOrder = query.sort === 'asc' ? 1 : -1;

    // Pagination
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedbacks = await this.feedbackModel
      .find(filter)
      .populate('userId', 'name mobile gmail')
      .populate('questionId', 'questionText')
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.feedbackModel.countDocuments(filter);

    return {
      feedbacks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async updateFeedbackStatus(id: string, status: string) {
    return await this.feedbackModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
  }
}
