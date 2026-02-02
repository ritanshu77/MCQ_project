import { Controller, Get, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  healthCheck(@Req() req: Request, @Res() res: Response) {
    console.log(
      `[Health Check] Ping received from ${req.headers.origin || 'unknown origin'} at ${new Date().toISOString()}`,
    );
    return res.json({
      status: 'OK',
      service: 'Exam Bank API',
      timestamp: new Date().toString(),
      timezone: process.env.TZ,
      environment: process.env.NODE_ENV || 'development',
    });
  }
}
