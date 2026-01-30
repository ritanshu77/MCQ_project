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
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/core/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Helper to validate name and mobile format
   */
  private validateInput(name: string, mobile?: string) {
    // Name validation: 3-50 chars, letters, spaces, dots
    if (name.length < 3 || name.length > 50) {
      throw new BadRequestException('Name must be between 3 and 50 characters');
    }
    if (!/^[a-zA-Z\s\.]+$/.test(name)) {
      throw new BadRequestException('Name can only contain letters, spaces, and dots');
    }

    // Mobile validation: exactly 10 digits
    if (mobile) {
      const cleanMobile = mobile.trim();
      if (!/^\d{10}$/.test(cleanMobile)) {
        throw new BadRequestException('Mobile number must be exactly 10 digits');
      }
    }
  }

  /**
   * Register a permanent user
   */
  async register(registerData: {
    name: string;
    email?: string;
    mobile?: string;
    password?: string;
    deviceId?: string;
  }): Promise<{ user: any; token: string }> {
    const { name, email, mobile, password } = registerData;

    if (!name) throw new BadRequestException('Name is required');
    if (!email && !mobile) throw new BadRequestException('Email or Mobile is required');
    if (!password) throw new BadRequestException('Password is required');

    this.validateInput(name, mobile);

    // Check if user exists
    const query: { $or: any[] } = { $or: [] };
    if (email) query.$or.push({ gmail: email });
    if (mobile) query.$or.push({ mobile: mobile });

    if (query.$or.length > 0) {
      const existingUser = await this.userModel.findOne(query);
      if (existingUser) {
        throw new ConflictException('User with this email/mobile already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      name,
      gmail: email,
      mobile,
      password: hashedPassword,
      type: 'registered',
      sessions: [],
    });

    if (registerData.deviceId) {
      user.sessions.push({
        deviceId: registerData.deviceId,
        lastActive: new Date(),
        totalTime: 0,
      });
    }

    await user.save();
    const token = await this.generateToken(user._id.toString());

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.gmail,
            mobile: user.mobile,
            type: user.type,
        },
        token
    };
  }

  /**
   * Login for permanent users (with password)
   */
  async loginUser(loginData: {
    identifier: string; // email or mobile
    password: string;
    deviceId?: string;
  }): Promise<{ user: any; token: string }> {
    const { identifier, password } = loginData;

    // Find user by email or mobile
    const user = await this.userModel.findOne({
      $or: [{ gmail: identifier }, { mobile: identifier }],
    }).select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
        throw new UnauthorizedException('Please login via other method (no password set)');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update sessions/activity
    if (loginData.deviceId) {
        const sessionIndex = user.sessions.findIndex(s => s.deviceId === loginData.deviceId);
        if (sessionIndex > -1) {
            user.sessions[sessionIndex].lastActive = new Date();
        } else {
            user.sessions.push({
                deviceId: loginData.deviceId,
                lastActive: new Date(),
                totalTime: 0
            });
        }
        await user.save();
    }

    const token = await this.generateToken(user._id.toString());

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.gmail,
            mobile: user.mobile,
            type: user.type,
        },
        token
    };
  }

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
          mobile: user.mobile,
          gmail: user.gmail,
          browserId: user.browserId,
          type: user.type,
          sessionCount: user.sessions.length,
          totalTimeSpent: user.totalTimeSpent,
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
      console.warn(`updateSessionTime: User ${userId} not found`);
      throw new NotFoundException('User not found');
    }

    const session = user.sessions.find((s) => s.deviceId === deviceId);

    if (session) {
      session.totalTime += additionalTime;
      session.lastActive = new Date();
    } else {
        // Create new session if missing (robustness)
        console.log(`updateSessionTime: Creating new session for user ${userId} device ${deviceId}`);
        user.sessions.push({
            deviceId,
            lastActive: new Date(),
            totalTime: additionalTime
        });
    }

    // Update global totalTimeSpent
    user.totalTimeSpent = (user.totalTimeSpent || 0) + additionalTime;
    
    return user.save();
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: { name: string; mobile?: string; gmail?: string }) {
    const { name, gmail, mobile } = updateData;

    if (!name) throw new BadRequestException('Name is required');
    if (!gmail && !mobile) throw new BadRequestException('Either Email or Mobile is required');

    this.validateInput(name, mobile);

    // Check if email/mobile is already taken by ANOTHER user
    const query: { $or: any[]; _id: { $ne: string } } = { 
        $or: [],
        _id: { $ne: userId }
    };
    if (gmail) query.$or.push({ gmail: gmail });
    if (mobile) query.$or.push({ mobile: mobile });

    if (query.$or.length > 0) {
        const existingUser = await this.userModel.findOne(query);
        if (existingUser) {
            throw new ConflictException('Email or Mobile already in use by another account');
        }
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.name = name;
    
    // Handle email update (allow clearing if empty string provided)
    if (updateData.gmail !== undefined) {
        user.gmail = updateData.gmail ? updateData.gmail : undefined;
    }
    
    // Handle mobile update (allow clearing if empty string provided)
    if (updateData.mobile !== undefined) {
        user.mobile = updateData.mobile ? updateData.mobile : undefined;
    }
    
    // Upgrade guest to registered if they add contact info
    if (user.type === 'guest' && (user.gmail || user.mobile)) {
        user.type = 'registered';
    }
    
    return await user.save();
  }
}
