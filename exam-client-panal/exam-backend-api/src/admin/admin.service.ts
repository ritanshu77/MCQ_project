import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/core/user.schema';
import { Question, QuestionDocument } from '../schemas/exam-bank/question.schema';
import { QuestionFeedback, QuestionFeedbackDocument } from '../schemas/core/question-feedback.schema';
import { Admin, AdminDocument } from '../schemas/core/admin.schema';
import { TestResult, TestResultDocument } from '../schemas/core/test-result.schema';
import { Subject, SubjectDocument } from '../schemas/exam-bank/subject.schema';
import { Unit, UnitDocument } from '../schemas/exam-bank/unit.schema';
import { Chapter, ChapterDocument } from '../schemas/exam-bank/chapter.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(QuestionFeedback.name) private feedbackModel: Model<QuestionFeedbackDocument>,
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(TestResult.name) private testResultModel: Model<TestResultDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Unit.name) private unitModel: Model<UnitDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    private jwtService: JwtService,
  ) {}

  async getDashboardStats() {
    const totalQuestions = await this.questionModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments();
    const pendingFeedback = await this.feedbackModel.countDocuments({ status: 'pending' });
    
    const totalSubjects = await this.subjectModel.countDocuments();
    const totalUnits = await this.unitModel.countDocuments();
    const totalChapters = await this.chapterModel.countDocuments();
    
    const registeredUsers = await this.userModel.countDocuments({ type: 'registered' });
    const guestUsers = await this.userModel.countDocuments({ type: 'guest' });

    const testStats = await this.testResultModel.aggregate([
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    const totalTestsTaken = testStats.length > 0 ? testStats[0].totalTests : 0;
    const averageGlobalScore = testStats.length > 0 ? Math.round(testStats[0].avgScore * 10) / 10 : 0;

    return {
      totalQuestions,
      activeUsers,
      pendingFeedback,
      totalSubjects,
      totalUnits,
      totalChapters,
      registeredUsers,
      guestUsers,
      totalTestsTaken,
      averageGlobalScore
    };
  }

  async getUsers(page: number = 1, limit: number = 20, search: string = '', type: string = 'all') {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { gmail: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const users = await this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.userModel.countDocuments(query);

    return {
      users,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(data: any) {
    const { name, email, mobile, password, type } = data;

    if (!name) throw new Error('Name is required');

    // Check for existing user
    const query: { $or: any[] } = { $or: [] };
    if (email) query.$or.push({ gmail: email });
    if (mobile) query.$or.push({ mobile: mobile });

    if (query.$or.length > 0) {
      const existingUser = await this.userModel.findOne(query);
      if (existingUser) {
        throw new ConflictException('User with this email/mobile already exists');
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    const newUser = new this.userModel({
      name,
      gmail: email,
      mobile,
      password: hashedPassword,
      type: type || 'registered',
      sessions: [],
    });

    await newUser.save();
    return newUser;
  }

  async updateUser(id: string, data: any) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (data.name) user.name = data.name;
    if (data.email !== undefined) user.gmail = data.email;
    if (data.mobile !== undefined) user.mobile = data.mobile;
    if (data.type) user.type = data.type;
    
    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10);
    }

    await user.save();
    return user;
  }

  async getUserDetails(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new Error('User not found');
    }

    // Get test statistics
    const testStats = await this.testResultModel.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalTests: { $sum: 1 },
          avgScore: { $avg: '$score' },
          lastTestDate: { $max: '$createdAt' }
        }
      }
    ]);

    const stats = testStats.length > 0 ? testStats[0] : { totalTests: 0, avgScore: 0, lastTestDate: null };

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.gmail,
        mobile: user.mobile,
        type: user.type,
        totalTimeSpent: user.totalTimeSpent || 0,
        createdAt: user.createdAt,
        sessions: user.sessions,
      },
      stats: {
        totalTests: stats.totalTests,
        avgScore: Math.round(stats.avgScore * 10) / 10, // Round to 1 decimal
        lastTestDate: stats.lastTestDate
      }
    };
  }

  async register(data: any) {
    const existingAdmin = await this.adminModel.findOne({ email: data.email });
    if (existingAdmin) {
      throw new ConflictException('Admin already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newAdmin = new this.adminModel({
      ...data,
      password: hashedPassword,
    });

    await newAdmin.save();
    return { message: 'Admin registered successfully' };
  }

  async login(data: any) {
    const admin = await this.adminModel.findOne({ email: data.email });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: admin._id, email: admin.email, role: admin.role };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}
