import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AttemptsService } from './attempts.service';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('progress')
  @HttpCode(HttpStatus.OK)
  async saveProgress(@Body() data: any) {
    try {
      const result = await this.attemptsService.saveProgress(data);
      return {
        success: true,
        message: 'Progress saved successfully',
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to save progress',
        error: error.message,
      };
    }
  }

  @Get('progress')
  async getProgress(
    @Query('userId') userId: string,
    @Query('questionSetId') questionSetId: string,
  ) {
    try {
      const result = await this.attemptsService.getProgress(
        userId,
        questionSetId,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch progress',
        error: error.message,
      };
    }
  }

  @Get('history')
  async getHistory(
    @Query('userId') userId: string,
    @Query('quizType') quizType?: string,
    @Query('titleId') titleId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('status') status?: string,
  ) {
    try {
      const result = await this.attemptsService.getHistory(userId, {
        quizType,
        titleId,
        chapterId,
        status,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch history',
        error: error.message,
      };
    }
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetProgress(@Body() body: { userId: string; questionSetId: string }) {
    try {
      const result = await this.attemptsService.resetProgress(
        body.userId,
        body.questionSetId,
      );
      return {
        success: true,
        message: 'Progress reset successfully',
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reset progress',
        error: error.message,
      };
    }
  }
}
