import { Controller, Post, Body, Get, Patch, Param, Query } from '@nestjs/common';
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
  async getAllFeedbacks(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.feedbackService.getFeedbacks({ search, status, sort, page, limit });
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return await this.feedbackService.updateFeedbackStatus(id, body.status);
  }
}
