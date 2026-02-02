import { Controller, Get, Post, Put, Body, UseGuards, Req, Query, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return await this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search: string = '',
    @Query('type') type: string = 'all',
  ) {
    return await this.adminService.getUsers(Number(page), Number(limit), search, type);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return await this.adminService.getUserDetails(id);
  }

  @Post('users')
  async createUser(@Body() body: any) {
    return await this.adminService.createUser(body);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return await this.adminService.updateUser(id, body);
  }

  @Public()
  @Post('register')
  async register(@Body() body: any) {
    return await this.adminService.register(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: any) {
    return await this.adminService.login(body);
  }
}
