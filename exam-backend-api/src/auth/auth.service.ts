import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/core/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Login with name and device information from frontend
   * Device info (deviceId, browserId, systemInfo, userAgent) comes from frontend
   * Always creates a new user entry (allows duplicate names)
   */
  async login(loginData: {
    name: string;
    deviceId?: string;
    browserId?: string;
    systemInfo?: string;
    userAgent?: string;
  }): Promise<{
    user: any;
    token: string;
    isNewUser: boolean;
  }> {
    if (!loginData.name || loginData.name.trim() === '') {
      throw new BadRequestException('Name is required for login');
    }

    const trimmedName = loginData.name.trim();

    // Create a new user entry every time (allows duplicate names)
    const user = new this.userModel({
      name: trimmedName,
      browserId: loginData.browserId || null,
      type: 'guest',
      sessions: [],
    });

    // Add device session if provided
    if (loginData.deviceId) {
      user.sessions.push({
        deviceId: loginData.deviceId,
        lastActive: new Date(),
        totalTime: 0,
      });
    }

    await user.save();

    // Generate JWT token
    const token = await this.generateToken(user._id.toString());

    return {
      user: {
        id: user._id,
        name: user.name,
        browserId: user.browserId,
        type: user.type,
        sessionCount: user.sessions.length,
        createdAt: user.createdAt,
      },
      token,
      isNewUser: true,
    };
  }

  /**
   * Generate JWT token for user
   */
  async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Validate token and return user info
   */
  async validateToken(token: string): Promise<{
    valid: boolean;
    user?: any;
    message: string;
  }> {
    try {
      if (!token) {
        return {
          valid: false,
          message: 'Token is required',
        };
      }

      // Remove "Bearer " prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

      const decoded = await this.jwtService.verifyAsync(cleanToken);

      // Verify user exists in database
      const user = await this.userModel.findById(decoded.sub).select('-__v');

      if (!user) {
        return {
          valid: false,
          message: 'User not found',
        };
      }

      return {
        valid: true,
        user: {
          id: user._id,
          name: user.name,
          browserId: user.browserId,
          type: user.type,
          sessionCount: user.sessions.length,
          createdAt: user.createdAt,
        },
        message: 'Token is valid',
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid or expired token',
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }

  /**
   * Get user by name
   */
  async getUserByName(name: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ name: name.trim() });
  }

  /**
   * Update session time for device
   */
  async updateSessionTime(
    userId: string,
    deviceId: string,
    additionalTime: number,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const session = user.sessions.find((s) => s.deviceId === deviceId);

    if (session) {
      session.totalTime += additionalTime;
      session.lastActive = new Date();
    }

    return user.save();
  }
}
