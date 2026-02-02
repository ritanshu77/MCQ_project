import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async submitFeedback(
    @Body() body: { questionId: string; feedback: string; userId?: string },
  ) {
    // If userId is passed from frontend, use it, otherwise might need from auth req
    // For now using body.userId as requested
    return await this.feedbackService.createFeedback(
      body.userId || '',
      body.questionId,
      body.feedback,
    );
  }

  @Get()
  async getAllFeedbacks() {
    return await this.feedbackService.getFeedbacks();
  }
}
