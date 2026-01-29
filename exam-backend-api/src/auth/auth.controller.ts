import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login with name and optional device information
   * Allows duplicate names - each login creates a new user entry
   * POST /auth/login
   * Required: name
   * Optional: deviceId, browserId, systemInfo, userAgent
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body()
    loginData: {
      name: string;
      deviceId?: string;
      browserId?: string;
      systemInfo?: string;
      userAgent?: string;
    },
  ) {
    try {
      const result = await this.authService.login(loginData);

      return {
        success: true,
        message: 'Logged in successfully - new user created',
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Login failed',
        error: error.message,
      };
    }
  }

  /**
   * Register permanent user
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() body: any) {
    try {
        const result = await this.authService.register(body);
        return {
            success: true,
            message: 'Registered successfully',
            data: result
        }
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Registration failed',
            error: error.message
        }
    }
  }

  /**
   * Login permanent user
   */
  @Public()
  @Post('login-user')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() body: any) {
    try {
        const result = await this.authService.loginUser(body);
        return {
            success: true,
            message: 'Logged in successfully',
            data: result
        }
    } catch (error: any) {
        throw new UnauthorizedException(error.message || 'Login failed');
    }
  }

  /**
   * Validate JWT token (POST)
   * POST /auth/validate-token
   */
  @Public()
  @Post('validate-token')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body() body: { token: string }) {
    const result = await this.authService.validateToken(body.token);
    return result;
  }

  /**
   * Validate token using Authorization header (GET)
   * GET /auth/validate
   */
  @Public()
  @Get('validate')
  @HttpCode(HttpStatus.OK)
  async validateTokenFromHeader(@Headers('authorization') authHeader: string) {
    if (!authHeader) {
      return {
        valid: false,
        message: 'Authorization header is required',
      };
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    return this.authService.validateToken(token);
  }

  /**
   * Refresh token
   * POST /auth/refresh-token
   */
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { token: string }) {
    try {
      const validated = await this.authService.validateToken(body.token);

      if (!validated.valid) {
        return {
          success: false,
          message: 'Invalid token, cannot refresh',
        };
      }

      const newToken = await this.authService.generateToken(
        validated.user.id.toString(),
      );

      return {
        success: true,
        message: 'Token refreshed successfully',
        token: newToken,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Token refresh failed',
      };
    }
  }

  /**
   * Update session time
   * POST /auth/session-time
   */
  @Post('session-time')
  @HttpCode(HttpStatus.OK)
  async updateSessionTime(@Body() body: { userId: string; deviceId: string; time: number }) {
      await this.authService.updateSessionTime(body.userId, body.deviceId, body.time);
      return { success: true };
  }

  /**
   * Update User Profile
   * PUT /auth/profile
   */
  @Post('profile') // Using Post for simplicity or PUT
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Body() body: { userId: string; name: string; mobile: string; gmail: string }) {
    try {
      if (!body.userId) throw new Error('User ID is required');
      
      const updatedUser = await this.authService.updateProfile(body.userId, {
        name: body.name,
        mobile: body.mobile,
        gmail: body.gmail
      });
      
      return {
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Profile update failed',
      };
    }
  }
}
