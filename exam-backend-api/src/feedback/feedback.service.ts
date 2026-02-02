import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QuestionFeedback, QuestionFeedbackDocument } from '../schemas/core/question-feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(QuestionFeedback.name)
    private feedbackModel: Model<QuestionFeedbackDocument>,
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

  async getFeedbacks() {
    return await this.feedbackModel
      .find()
      .populate('userId', 'name mobile gmail')
      .populate('questionId', 'questionText')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateFeedbackStatus(id: string, status: string) {
    return await this.feedbackModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
  }
}
