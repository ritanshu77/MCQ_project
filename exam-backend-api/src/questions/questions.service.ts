import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BulkCreateQuestionsDto } from './dto/bulk-create-questions.dto';

import { Title, TitleDocument } from '../schemas/exam-bank/title.schema';
import { Exam, ExamDocument } from '../schemas/exam-bank/exam.schema';
import { Subject, SubjectDocument } from '../schemas/exam-bank/subject.schema';
import { Unit, UnitDocument } from '../schemas/exam-bank/unit.schema';
import { Chapter, ChapterDocument } from '../schemas/exam-bank/chapter.schema';
import {
  Question,
  QuestionDocument,
} from '../schemas/exam-bank/question.schema';
import {
  QuestionSet,
  QuestionSetDocument,
} from '../schemas/exam-bank/question-set.schema';

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    @InjectModel(Title.name) private titleModel: Model<TitleDocument>,
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(Subject.name) private subjectModel: Model<SubjectDocument>,
    @InjectModel(Unit.name) private unitModel: Model<UnitDocument>,
    @InjectModel(Chapter.name) private chapterModel: Model<ChapterDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(QuestionSet.name)
    private questionSetModel: Model<QuestionSetDocument>,
  ) {}


  private generateCode(name: string, prefix: string = ''): string {
    const codePart = name
      .substring(0, 4)
      .replace(/[^a-zA-Z\u0900-\u097F0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${codePart.toUpperCase()}-${timestamp}`;
  }

  async bulkCreateQuestions(dto: BulkCreateQuestionsDto) {
    const results = {
      total: dto.questions.length,
      created: 0,
      titlesCreated: 0,
      examsCreated: 0,
      subjectsCreated: 0,
      unitsCreated: 0,
      chaptersCreated: 0,
      setsCreated: 0,
      errors: [] as string[],
    };

    // 1. Title create/find
    let titleId: Types.ObjectId | undefined;
    let examId: Types.ObjectId | undefined;
    if (dto.title) {
      let title = await this.titleModel.findOne({
        $or: [{ 'name.hi': dto.title }, { 'name.en': dto.title }],
      });
      if (!title) {
        title = await this.titleModel.create({
          code: this.generateCode(dto.title, 'T_'),
          name: { hi: dto.title, en: dto.title },
          aiGenerated: !!dto.excludeFromGlobalChapterSets,
        });
        results.titlesCreated++;
      }
      titleId = title._id;
    }

    // ⭐ EXAM (Independent Optional)
    if (dto.exam) {
      let exam = await this.examModel.findOne({
        $or: [{ 'name.hi': dto.exam }, { 'name.en': dto.exam }],
      });
      if (!exam) {
        let insertExamObject = {
          code: this.generateCode(dto.exam, 'E_'),
          name: { hi: dto.exam, en: dto.exam }
        }
        //  year insertExamObjectnew Date().getFullYear(), // year was include n exam name
        exam = await this.examModel.create(insertExamObject);
        results.examsCreated++;
      }
      examId = exam._id;
    }

    // 3. Caches
    const subjectCache: { [key: string]: Types.ObjectId } = {};
    const unitCache: { [key: string]: Types.ObjectId } = {};
    const chapterCache: { [key: string]: Types.ObjectId } = {};

    const questionsToInsert: any[] = [];

    // 4. Process each question (Aapka exact format)
    for (const [index, q] of dto.questions.entries()) {
      try {
        // ✅ PROPER HIERARCHY FIX
        const subjectName = q.subjectName;
        const unitName = q.unitName; // ⭐ q.unitName NOT q.subjectName
        const chapterName = q.chapterName;

        // Option validation ⭐ NEW
        const optionKeys = q.options.map((opt: any) => opt.key);
        if (!optionKeys.includes(q.correctOptionKey)) {
          console.log('===error====optionKeys===', optionKeys);
          results.errors.push(
            `❌ Q${index + 1}: INVALID OPTION "${q.correctOptionKey}" - Options: [${optionKeys.join(', ')}]`,
          );
          continue;
        }

        // Subject create/find
        if (!subjectCache[subjectName]) {
          let subject = await this.subjectModel.findOne({
            $or: [{ 'name.hi': subjectName }, { 'name.en': subjectName }],
          });
          if (!subject) {
            subject = await this.subjectModel.create({
              code: this.generateCode(subjectName, 'SUB_'),
              name: { hi: subjectName, en: subjectName },
              description: {
                // ✅ Description add
                hi: (q as any).subjectDescriptionHi || '',
                en: (q as any).subjectDescriptionEn || '',
              },
            });
            results.subjectsCreated++;
          }
          subjectCache[subjectName] = subject._id;
        }

        // Unit create/find (subjectName ko unit banao)
        const unitKey = unitName;
        if (!unitCache[unitKey]) {
          let unit = await this.unitModel.findOne({
            subjectId: subjectCache[subjectName],
            $or: [{ 'name.hi': unitName }, { 'name.en': unitName }],
          });
          if (!unit) {
            unit = await this.unitModel.create({
              subjectId: subjectCache[subjectName],
              code: this.generateCode(unitName, 'U_'),
              name: { hi: unitName, en: unitName },
              description: {
                hi: (q as any).unitDescriptionHi || '',
                en: (q as any).unitDescriptionEn || '',
              },
            });
            results.unitsCreated++;
          }
          unitCache[unitKey] = unit._id;
        }

        // Chapter create/find
        const chapterKey = `${unitName}_${chapterName}`;
        if (!chapterCache[chapterKey]) {
          let chapter = await this.chapterModel.findOne({
            unitId: unitCache[unitKey],
            $or: [{ 'name.hi': chapterName }, { 'name.en': chapterName }],
          });
          if (!chapter) {
            chapter = await this.chapterModel.create({
              unitId: unitCache[unitKey],
              code: this.generateCode(chapterName, 'C_'),
              name: { hi: chapterName, en: chapterName },
              description: {
                hi: (q as any).chapterDescriptionHi || '',
                en: (q as any).chapterDescriptionEn || '',
              },
            });
            results.chaptersCreated++;
          }
          chapterCache[chapterKey] = chapter._id;
        }

        // Duplicate check
        const questioncheckobject: any = {
          chapterId: chapterCache[chapterKey],
          'questionText.hi': q.questionTextHi,
          'questionText.en': q.questionTextEn,
        };
        if (examId) questioncheckobject.examId = examId;
        if (titleId) questioncheckobject.titleId = titleId;
        const existingQuestion = await this.questionModel.findOne(questioncheckobject);

        if (existingQuestion) {
          console.log('===error=======', existingQuestion);
          results.errors.push(
            `❌ Q${index + 1} DUPLICATE: ${q.questionTextHi.substring(0, 50)}...`,
          );
          continue;
        }

        // Question prepare (Aapka exact format map)
        questionsToInsert.push({
          titleId,
          examId,
          subjectId: subjectCache[subjectName],
          unitId: unitCache[unitKey],
          chapterId: chapterCache[chapterKey],
          questionNumber: q.questionNumber || index + 1,
          questionText: {
            hi: q.questionTextHi,
            en: q.questionTextEn,
          },
          options: q.options.map((opt: any) => ({
            key: opt.key,
            text: {
              hi: opt.textHi,
              en: opt.textEn,
            },
          })),
          correctOptionKey: q.correctOptionKey,
          explanation: {
            hi: q.explanationHi || '',
            en: q.explanationEn || '',
          },
          difficulty: q.difficulty || 'medium',
          isPreviousYear: q.isPreviousYear || false,
          previousExamCode: q.previousExamCode || '',
          status: 'active',
        });
      } catch (error) {
        console.log('===error=======', error);
        results.errors.push(`❌ Q${index + 1} ERROR: ${error.message}`);
      }
    }

    // 5. Bulk insert
    const insertedQuestions = await this.questionModel.insertMany(
      questionsToInsert,
      {
        ordered: false,
      },
    );
    results.created = insertedQuestions.length;

    // 6. Auto-create QuestionSets (Title & Exam)
    if (insertedQuestions.length > 0) {
      const chapterQuestions = insertedQuestions.reduce(
        (acc: { [key: string]: QuestionDocument[] }, q) => {
          if (q.chapterId) {
            const chId = q.chapterId.toString();
            if (!acc[chId]) acc[chId] = [];
            acc[chId].push(q);
          }
          return acc;
        },
        {} as { [key: string]: QuestionDocument[] },
      );

      for (const [chapterIdStr, questions] of Object.entries(
        chapterQuestions,
      )) {
        // Create Title Sets
        if (titleId) {
          await this.createQuestionSets(
            { titleId, quizType: 'title' },
            questions,
          );
          results.setsCreated++;
        }

        // Create Exam Sets
        if (examId) {
          await this.createQuestionSets(
            { examId, quizType: 'exam' },
            questions,
          );
          results.setsCreated++;
        }

        // Create Chapter Sets (Global)
        const chapterId = new Types.ObjectId(chapterIdStr);
        if (chapterId) {
          // ✅ CHECK FLAG: Skip global sets if requested
          if (!dto.excludeFromGlobalChapterSets) {
            await this.createQuestionSets(
              { chapterId, quizType: 'chapter' },
              questions,
            );
            results.setsCreated++;
          }

          // Create Title-Chapter Sets (Specific to this Title)
          if (titleId) {
            await this.createQuestionSets(
              { titleId, chapterId, quizType: 'title-chapter' },
              questions,
            );
            results.setsCreated++;
          }
        }
      }
    }

    this.logger.log(
      `Bulk insert: ${results.created} questions, ${results.setsCreated} sets`,
    );

    return {
      success: true,
      ...results,
      sampleIds: insertedQuestions.slice(0, 5).map((q: any) => q._id),
    };
  }

  private async createQuestionSets(
    criteria: {
      titleId?: Types.ObjectId;
      chapterId?: Types.ObjectId;
      examId?: Types.ObjectId;
      quizType: string;
    },
    questions: QuestionDocument[],
  ) {
    const { titleId, chapterId, examId, quizType } = criteria;

    // ⭐ LOGIC: Title/Chapter = 100 limit, Exam = Unlimited
    const questionsPerSet = quizType === 'exam' ? 10000 : 100;

    console.log(
      `🎯 ${quizType.toUpperCase()} (T:${titleId} C:${chapterId} E:${examId}): Processing ${questions.length} new questions`,
    );

    // 1. Find TARGET set (Incomplete for Title/Chapter, ANY Latest for Exam)
    const query: any = { quizType };
    if (titleId) query.titleId = titleId;
    if (chapterId) query.chapterId = chapterId;
    if (examId) query.examId = examId;

    // For Titles/Chapters, we only want to fill INCOMPLETE sets.
    // For Exams, we want to fill the LATEST set regardless of status (Unlimited sets).
    if (quizType !== 'exam') {
      query.isActive = false;
    }

    const targetSet = await this.questionSetModel
      .findOne(query)
      .sort({ setNumber: -1 });

    if (targetSet && questions.length > 0) {
      const currentCount = targetSet.questionIds.length;
      const needed = questionsPerSet - currentCount;

      if (needed > 0) {
        console.log(
          `🔄 Set ${targetSet.setNumber}: ${currentCount}/${questionsPerSet} → Adding...`,
        );

        // Fill/Append to set
        const questionsToAdd = questions.slice(0, needed).map((q) => q._id);
        targetSet.questionIds.push(...questionsToAdd);
        targetSet.totalQuestions = targetSet.questionIds.length;

        // Update Active Status
        targetSet.isActive =
          quizType === 'exam'
            ? true
            : targetSet.totalQuestions >= questionsPerSet;

        await targetSet.save();

        console.log(
          `✅ Set ${targetSet.setNumber} UPDATED! ${targetSet.totalQuestions} Questions`,
        );

        // Remove used questions
        questions = questions.slice(needed);
      }
    }

    // 2. NEW SETS with remaining questions
    if (questions.length > 0) {
      console.log(`➕ Remaining ${questions.length}Q → Creating new sets`);

      const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

      for (let i = 0; i < shuffledQuestions.length; i += questionsPerSet) {
        const setQuestions = shuffledQuestions.slice(i, i + questionsPerSet);

        // Find last set for numbering
        const lastSetQuery: any = { quizType };
        if (titleId) lastSetQuery.titleId = titleId;
        if (chapterId) lastSetQuery.chapterId = chapterId;
        if (examId) lastSetQuery.examId = examId;

        const lastSet = await this.questionSetModel
          .findOne(lastSetQuery)
          .sort({ setNumber: -1 });
        const setNumber = (lastSet?.setNumber || 0) + 1;

        const isActive =
          quizType === 'exam' ? true : setQuestions.length === 100;

        await this.questionSetModel.create({
          titleId,
          chapterId,
          examId,
          name: { hi: `सेट ${setNumber}`, en: `Set ${setNumber}` },
          questionIds: setQuestions.map((q) => q._id),
          totalQuestions: setQuestions.length,
          setNumber,
          quizType,
          isActive,
        });

        console.log(
          `✅ Set ${setNumber}: ${setQuestions.length}Q ${isActive ? '(ACTIVE)' : '(PENDING)'}`,
        );
      }
    }
  }

  // All other methods
  async getQuestions(filters: any) {
    const query: any = { status: 'active' };

    if (filters.titleId) query.titleId = filters.titleId;
    if (filters.examId) query.examId = filters.examId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.unitId) query.unitId = filters.unitId;
    if (filters.chapterId) query.chapterId = filters.chapterId;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.setNumber) {
      const set = await this.questionSetModel.findOne({
        setNumber: parseInt(filters.setNumber),
      });
      if (set) query._id = { $in: set.questionIds };
    }

    return this.questionModel
      .find(query)
      .populate([
        { path: 'titleId', select: 'code name' },
        { path: 'examId', select: 'code name year' },
        { path: 'subjectId', select: 'code name' },
        { path: 'unitId', select: 'code name' },
        { path: 'chapterId', select: 'code name' },
      ])
      .limit(filters.limit || 20)
      .sort({ questionNumber: 1 })
      .exec();
  }

  async getQuestionsByChapter(
    chapterId: string,
    limit?: number,
    setNumber?: string,
  ) {
    const query: any = { chapterId, status: 'active' };
    if (setNumber) {
      const questionSet = await this.questionSetModel.findOne({
        chapterId,
        setNumber: parseInt(setNumber),
      });
      if (questionSet) query._id = { $in: questionSet.questionIds };
    }

    return this.questionModel
      .find(query)
      .populate('titleId unitId subjectId')
      .limit(limit || 50)
      .sort({ questionNumber: 1 })
      .exec();
  }

  async getQuestionsByUnit(unitId: string, limit?: number) {
    return this.questionModel
      .find({ unitId, status: 'active' })
      .populate('chapterId titleId')
      .limit(limit || 100)
      .sort({ questionNumber: 1 })
      .exec();
  }

  async getQuestionsByTitle(titleId: string, limit?: number) {
    return this.questionModel
      .find({ titleId, status: 'active' })
      .populate('chapterId unitId subjectId')
      .limit(limit || 100)
      .sort({ questionNumber: 1 })
      .exec();
  }

  async getQuestionSets(filters: {
    titleId?: string;
    chapterId?: string;
    examId?: string;
    quizType?: string;
  }) {
    const query: any = { isActive: true };
    if (filters.titleId) query.titleId = filters.titleId;
    if (filters.chapterId) query.chapterId = filters.chapterId;
    if (filters.examId) query.examId = filters.examId;
    if (filters.quizType) query.quizType = filters.quizType;

    return this.questionSetModel
      .find(query)
      .populate('titleId chapterId examId')
      .sort({ setNumber: 1 })
      .exec();
  }

  async getNextSetForUser(titleId: string, chapterId: string, userId: string) {
    return this.questionSetModel
      .findOne({
        titleId,
        chapterId,
        isActive: true,
      })
      .sort({ setNumber: 1 });
  }

  async getQuestionsBySet(setId: string) {
    const questionSet = await this.questionSetModel.findById(setId);
    if (!questionSet) throw new NotFoundException('Question set not found');

    return await this.questionModel
      .find({ _id: { $in: questionSet.questionIds } })
      .populate([
        { path: 'titleId', select: 'name' },
        { path: 'chapterId', select: 'name' },
        { path: 'unitId', select: 'name' },
        { path: 'subjectId', select: 'name' },
      ])
      .sort({ questionNumber: 1 });
  }

  async findOne(id: string) {
    return this.questionModel
      .findById(id)
      .populate('titleId examId subjectId unitId chapterId')
      .exec();
  }

  async findAll() {
    return this.questionModel
      .find({ status: 'active' })
      .populate('titleId examId subjectId unitId chapterId')
      .limit(100)
      .sort({ questionNumber: 1 })
      .exec();
  }

  // ⭐ NEW METHOD - Line 400 ke baad add karo
  async createSetsFromTitle(titleId: string) {
    const titleObjectId = new Types.ObjectId(titleId);

    // 1. Get ALL active questions for this title
    const allQuestions = await this.questionModel
      .find({
        titleId: titleObjectId,
        status: 'active',
      })
      .sort({ questionNumber: 1 });

    if (allQuestions.length === 0) {
      return { success: false, message: 'No questions found for this title' };
    }

    console.log(`🎯 TITLE ${titleId}: Found ${allQuestions.length} questions`);

    // 2. Delete existing sets for this title (clean start)
    // await this.questionSetModel.deleteMany({ titleId: titleObjectId });
    // console.log('🗑️  Existing sets deleted');

    // 3. Shuffle & create sequential sets
    const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
    const questionsPerSet = 100;
    let setsCreated = 0;

    for (let i = 0; i < shuffledQuestions.length; i += questionsPerSet) {
      const setQuestions = shuffledQuestions.slice(i, i + questionsPerSet);
      const isActive = setQuestions.length === 100;

      await this.questionSetModel.create({
        titleId: titleObjectId,
        name: {
          hi: `सेट ${setsCreated + 1}`,
          en: `Set ${setsCreated + 1}`,
        },
        questionIds: setQuestions.map((q) => q._id),
        totalQuestions: setQuestions.length,
        setNumber: setsCreated + 1,
        quizType: 'title',
        isActive,
      });

      console.log(
        `✅ Set ${setsCreated + 1}: ${setQuestions.length}Q ${isActive ? '(ACTIVE)' : '(PENDING)'}`,
      );
      setsCreated++;
    }

    return {
      success: true,
      totalQuestions: allQuestions.length,
      setsCreated,
      activeSets: await this.questionSetModel.countDocuments({
        titleId: titleObjectId,
        isActive: true,
      }),
    };
  }

  // ⭐ ADMIN API: Generate Title-Chapter Sets
  async generateTitleChapterSets(targetTitleId?: string) {
    console.log(
      `🚀 Starting Title-Chapter Set Generation... ${targetTitleId ? `(Title: ${targetTitleId})` : '(ALL Titles)'}`,
    );

    // 1. Filter Questions
    const match: any = { status: 'active' };
    if (targetTitleId) {
      match.titleId = new Types.ObjectId(targetTitleId);
    } else {
      match.titleId = { $exists: true }; // Ensure they have a title
    }

    const allQuestions = await this.questionModel
      .find(match)
      .sort({ questionNumber: 1 });
    console.log(`📊 Found ${allQuestions.length} questions to process.`);

    // 2. Group by Title + Chapter
    const groups: { [key: string]: QuestionDocument[] } = {};

    for (const q of allQuestions) {
      // Check if titleId/chapterId exist
      if (!q.titleId || !q.chapterId) {
        // console.warn(`⚠️ Skipping Q ${q._id}: Missing Title or Chapter`);
        continue;
      }
      const key = `${q.titleId.toString()}|${q.chapterId.toString()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    }

    const results = {
      groupsProcessed: 0,
      setsCreated: 0,
      questionsProcessed: allQuestions.length,
    };

    // 3. Process Groups
    for (const [key, questions] of Object.entries(groups)) {
      try {
        const [tId, cId] = key.split('|');
        const titleId = new Types.ObjectId(tId);
        const chapterId = new Types.ObjectId(cId);

        // A. Delete existing 'title-chapter' sets for this pair
        await this.questionSetModel.deleteMany({
          titleId,
          chapterId,
          quizType: 'title-chapter',
        });

        // B. Create new sets (100 per set)
        const shuffled = [...questions].sort(() => Math.random() - 0.5);

        const questionsPerSet = 100;
        let setsForGroup = 0;

        for (let i = 0; i < shuffled.length; i += questionsPerSet) {
          const setQs = shuffled.slice(i, i + questionsPerSet);

          if (setQs.length === 0) {
            continue;
          }
          const firstQ = setQs[0];
          let unitId: any = (firstQ as any).unitDetails?._id || (firstQ as any).unitId;
          if (!unitId) {
            const chapterDoc = await this.chapterModel.findById(chapterId).select('unitId');
            unitId = chapterDoc?.unitId || undefined;
          }

          await this.questionSetModel.create({
            titleId,
            chapterId,
            unitId: unitId,
            name: {
              hi: `सेट ${setsForGroup + 1}`,
              en: `Set ${setsForGroup + 1}`,
            },
            questionIds: setQs.map((q) => q._id),
            totalQuestions: setQs.length,
            setNumber: setsForGroup + 1,
            quizType: 'title-chapter',
            isActive: setQs.length === questionsPerSet,
          });
          setsForGroup++;
        }

        results.setsCreated += setsForGroup;
        results.groupsProcessed++;
        console.log(
          `✅ Title ${tId} | Chapter ${cId}: Created ${setsForGroup} sets for ${questions.length} questions`,
        );
      } catch (err) {
        console.error(`❌ Error processing group ${key}:`, err);
      }
    }

    return { success: true, ...results };
  }

  async getSubjectStatsComplete(titleId?: string) {
    const match: any = { status: 'active' };
    if (titleId) {
      match.titleId = new Types.ObjectId(titleId);
    } else {
      // ✅ Exclude AI Generated titles from global subject stats
      const aiTitles = await this.titleModel
        .find({ aiGenerated: true })
        .select('_id');
      if (aiTitles.length > 0) {
        match.titleId = { $nin: aiTitles.map((t) => t._id) };
      }
    }

    const pipeline: any[] = [
      // ⭐ any[] fix
      // 1. Match active questions
      { $match: match },

      // 2. Group by subject
      {
        $group: {
          _id: '$subjectId',
          questions: { $push: '$$ROOT' },
          totalQuestions: { $sum: 1 },
          easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
          medium: {
            $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] },
          },
          hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
          chapters: { $addToSet: '$chapterId' },
          units: { $addToSet: '$unitId' },
        },
      },

      // 3. Lookup subject
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subjectDetails',
        },
      },

      // 3.5. Filter out subjects without details
      {
        $match: {
          subjectDetails: { $ne: [] },
        },
      },

      // 4. Project clean data
      {
        $project: {
          _id: 0,
          subjectId: '$_id',
          code: { $arrayElemAt: ['$subjectDetails.code', 0] },
          nameEn: { $arrayElemAt: ['$subjectDetails.name.en', 0] },
          nameHi: { $arrayElemAt: ['$subjectDetails.name.hi', 0] },
          descriptionEn: {
            $arrayElemAt: ['$subjectDetails.description.en', 0],
          },
          descriptionHi: {
            $arrayElemAt: ['$subjectDetails.description.hi', 0],
          },
          totalQuestions: 1,
          easy: 1,
          medium: 1,
          hard: 1,
          unitCount: { $size: { $ifNull: ['$units', []] } },
          chapterCount: { $size: { $ifNull: ['$chapters', []] } },
        },
      },

      // 5. ⭐ FIXED SORT - 1 / -1 only
      { $sort: { totalQuestions: -1 as any } }, // Type assertion
    ];

    const subjects = await this.questionModel.aggregate(pipeline);

    return {
      timestamp: new Date().toISOString(),
      totalSubjects: subjects.length,
      totalQuestions: subjects.reduce(
        (sum: number, s: any) => sum + (s.totalQuestions || 0),
        0,
      ),
      subjects,
    };
  }
  async getSubjectById(subjectId: string) {
    const ObjectId = Types.ObjectId;

    if (!ObjectId.isValid(subjectId)) {
      throw new BadRequestException(`Invalid subjectId: ${subjectId}`);
    }

    const subject = await this.subjectModel
      .findById(subjectId)
      .select('name code description createdAt updatedAt')
      .lean();

    if (!subject) {
      throw new NotFoundException(`Subject not found: ${subjectId}`);
    }

    return {
      _id: subject._id,
      name: subject.name, // { en: "Computer Science", hi: "कम्प्यूटर विज्ञान" }
      code: subject.code, // "CS101"
      description: subject.description,
    };
  }

  async getUnitsBySubject(
    subjectId: string,
    titleId?: string,
    quizType?: string,
  ) {
    try {
      const match: any = {
        status: 'active',
        subjectId: new Types.ObjectId(subjectId),
      };

      if (titleId) {
        match.titleId = new Types.ObjectId(titleId);
      }

      const pipeline: any[] = [
        // 1. Questions filter by SUBJECT
        { $match: match },

        // 2. Group by unit (Subject ke units only)
        {
          $group: {
            _id: '$unitId',
            totalQuestions: { $sum: 1 },
            easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
            medium: {
              $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] },
            },
            hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
            // chapters: { $addToSet: '$chapterId' }, // We fetch chapters separately now
          },
        },

        // 3. JOIN Unit table details
        {
          $lookup: {
            from: 'units',
            localField: '_id',
            foreignField: '_id',
            as: 'unit',
          },
        },

        // 4. Project clean output
        {
          $project: {
            _id: 0,
            unitId: '$_id',
            // ⭐ COMPLETE UNIT DETAILS
            code: { $arrayElemAt: ['$unit.code', 0] },
            name: {
              en: { $arrayElemAt: ['$unit.name.en', 0] },
              hi: { $arrayElemAt: ['$unit.name.hi', 0] },
            },
            description: {
              en: { $arrayElemAt: ['$unit.description.en', 0] },
              hi: { $arrayElemAt: ['$unit.description.hi', 0] },
            },
            totalQuestions: 1,
            easy: 1,
            medium: 1,
            hard: 1,
            // chapterCount: { $size: { $ifNull: ['$chapters', []] } },
          },
        },

        // 5. Sort by questions
        { $sort: { totalQuestions: -1 as any } },
      ];

      const units = await this.questionModel.aggregate(pipeline);

      // ⭐ Fetch Chapters and Sets for each Unit
      const unitsWithSets = await Promise.all(
        units.map(async (unit: any) => {
          // Fetch chapters for this unit
          const chapters = await this.chapterModel
            .find({ unitId: unit.unitId })
            .sort({ name: 1 })
            .lean();

          // Fetch sets for these chapters
          const chaptersWithSets = await Promise.all(
            chapters.map(async (chapter: any) => {
              const targetQuizType = quizType
                ? quizType
                : titleId
                  ? 'title-chapter'
                  : 'chapter';

              const setQuery: any = {
                chapterId: chapter._id,
                isActive: true,
                quizType: targetQuizType,
              };

              if (titleId) {
                setQuery.titleId = new Types.ObjectId(titleId);
              }

              const sets = await this.questionSetModel
                .find(setQuery)
                .select('name setNumber totalQuestions isActive')
                .sort({ setNumber: 1 })
                .lean();

              return {
                _id: chapter._id,
                name: chapter.name,
                code: chapter.code,
                description: chapter.description,
                sets,
              };
            }),
          );

          return {
            ...unit,
            chapterCount: chaptersWithSets.length,
            chapters: chaptersWithSets,
          };
        }),
      );

      return {
        subjectId,
        totalUnits: units.length,
        totalQuestions: units.reduce(
          (sum: number, u: any) => sum + u.totalQuestions,
          0,
        ),
        units: unitsWithSets,
      };
    } catch (error) {
      this.logger.error('Error in getUnitsBySubject:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to fetch units'
      );
    }
  }
  async getQuestionsByFilters(filters: {
    unitId?: string;
    titleId?: string;
    subjectId?: string;
    chapterId?: string;
    page?: number;
    limit?: number;
    difficulty?: string;
    search?: string;
  }) {
    const {
      unitId,
      titleId,
      subjectId,
      chapterId,
      page = 1,
      limit = 10,
      difficulty = 'all',
      search = '',
    } = filters;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      // ⭐ 1. INITIAL MATCH - Base filters
      {
        $match: {
          status: 'active',
          ...(unitId && { unitId: new Types.ObjectId(unitId) }),
          ...(titleId && { titleId: new Types.ObjectId(titleId) }),
        },
      },

      // ⭐ 2. JOIN UNITS → Get Subject info
      {
        $lookup: {
          from: 'units',
          localField: 'unitId',
          foreignField: '_id',
          as: 'unitDetails',
          pipeline: [
            {
              $lookup: {
                from: 'subjects',
                localField: 'subjectId',
                foreignField: '_id',
                as: 'subjectDetails',
                pipeline: [{ $project: { name: 1, code: 1 } }],
              },
            },
            {
              $unwind: {
                path: '$subjectDetails',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                name: { $ifNull: ['$name.en', 'Unknown'] },
                code: 1,
                subjectName: {
                  $ifNull: ['$subjectDetails.name.en', 'Unknown'],
                },
                subjectCode: { $ifNull: ['$subjectDetails.code', ''] },
              },
            },
          ],
        },
      },
      { $unwind: { path: '$unitDetails', preserveNullAndEmptyArrays: true } },

      // ⭐ 3. JOIN CHAPTERS
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapterId',
          foreignField: '_id',
          as: 'chapterDetails',
          pipeline: [
            {
              $project: { name: { $ifNull: ['$name.en', 'Unknown'] }, code: 1 },
            },
          ],
        },
      },
      {
        $unwind: { path: '$chapterDetails', preserveNullAndEmptyArrays: true },
      },

      // ⭐ 4. DYNAMIC FILTERS - Subject/Chapter (Future Ready)
      ...(subjectId
        ? [
            {
              $match: {
                'unitDetails.subjectCode': subjectId, // or subjectId field
              },
            },
          ]
        : []),

      ...(chapterId
        ? [
            {
              $match: {
                'chapterDetails._id': new Types.ObjectId(chapterId),
              },
            },
          ]
        : []),

      // ⭐ 5. Difficulty Filter
      ...(difficulty !== 'all'
        ? [
            {
              $match: { difficulty },
            },
          ]
        : []),

      // ⭐ 6. Search Filter
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { 'questionText.en': { $regex: search, $options: 'i' } },
                  { 'questionText.hi': { $regex: search, $options: 'i' } },
                ],
              },
            },
          ]
        : []),

      // ⭐ 7. PROJECT - Clean Frontend Structure
      {
        $project: {
          questionText: 1,
          options: 1,
          correctAnswer: 1,
          difficulty: 1,
          questionNumber: 1,
          explanation: 1,
          status: 1,
          subjectId: 1,
          unitId: 1,
          chapterId: 1,

          // ⭐ Complete Hierarchy
          unitName: '$unitDetails.name',
          unitCode: '$unitDetails.code',
          subjectName: '$unitDetails.subjectName',
          subjectCode: '$unitDetails.subjectCode',
          chapterName: '$chapterDetails.name',
          chapterCode: '$chapterDetails.code',
        },
      },

      // ⭐ 8. SORT
      { $sort: { questionNumber: 1, createdAt: -1 } },

      // ⭐ 9. FACET - Perfect Pagination (Single Query!)
      {
        $facet: {
          questions: [{ $skip: skip }, { $limit: limit }],
          pagination: [
            {
              $count: 'total',
            },
            {
              $project: {
                totalQuestions: { $ifNull: ['$total', 0] },
                totalPages: {
                  $ceil: { $divide: [{ $ifNull: ['$total', 0] }, limit] },
                },
                currentPage: page,
                limit: limit,
                hasNext: {
                  $lt: [
                    page,
                    { $ceil: { $divide: [{ $ifNull: ['$total', 0] }, limit] } },
                  ],
                },
                hasPrev: { $gt: [page, 1] },
              },
            },
          ],
          filtersUsed: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await this.questionModel.aggregate(pipeline);

    return {
      questions: result.questions || [],
      pagination: result.pagination[0] || {
        totalQuestions: 0,
        totalPages: 1,
        currentPage: page,
        limit,
        hasNext: false,
        hasPrev: false,
      },
      filtersApplied: result.filtersUsed.length > 0,
    };
  }

  async getTitlesList() {
    return this.titleModel
      .find()
      .select('name code description aiGenerated')
      .sort({ 'name.en': 1 })
      .lean()
      .exec();
  }

  async getExamsList() {
    return this.examModel
      .find()
      .select('name code year')
      .sort({ year: -1 })
      .lean()
      .exec();
  }

  async createSetsFromChapter(chapterId?: string) {
    // ⭐ IF NO chapterId -> Process ALL chapters
    if (!chapterId) {
      console.log('🔄 Bulk processing ALL chapters...');
      const allChapters = await this.chapterModel.find().select('_id name');

      const results: any[] = [];
      for (const ch of allChapters) {
        try {
          const res = await this.createSetsFromChapter(ch._id.toString());
          if (res.success) {
            results.push({ chapterId: ch._id, name: ch.name, ...res });
          }
        } catch (e) {
          console.error(`❌ Failed for chapter ${ch._id}:`, e.message);
        }
      }
      return {
        success: true,
        message: `Processed ${allChapters.length} chapters`,
        details: results,
      };
    }

    const chapterObjectId = new Types.ObjectId(chapterId);

    // 1. Get ALL active questions for this CHAPTER
    const allQuestions = await this.questionModel
      .find({
        chapterId: chapterObjectId,
        status: 'active',
      })
      .sort({ questionNumber: 1 });

    if (allQuestions.length === 0) {
      return { success: false, message: 'No questions found for this chapter' };
    }

    // ⭐ FETCH CHAPTER DETAILS to get unitId
    const chapter = await this.chapterModel.findById(chapterObjectId);
    const unitId = chapter?.unitId;

    console.log(
      `🎯 CHAPTER ${chapterId}: Found ${allQuestions.length} questions`,
    );

    // 2. Filter out questions ALREADY in sets (of type 'chapter')
    const existingSets = await this.questionSetModel.find({
      chapterId: chapterObjectId,
      quizType: 'chapter',
    });

    const usedQuestionIds = new Set(
      existingSets.flatMap((s) => s.questionIds.map((id) => id.toString())),
    );

    let questionsToProcess = allQuestions.filter(
      (q) => !usedQuestionIds.has(q._id.toString()),
    );

    console.log(
      `🔍 Available questions (not in sets): ${questionsToProcess.length}`,
    );

    if (questionsToProcess.length === 0) {
      return {
        success: false,
        message: 'All questions are already assigned to sets.',
      };
    }

    const questionsPerSet = 100;
    let setsCreated = 0;
    let setsUpdated = 0;

    // 3. Check for INCOMPLETE set first (active=false)
    const incompleteSet = await this.questionSetModel
      .findOne({
        chapterId: chapterObjectId,
        isActive: false,
        quizType: 'chapter',
      })
      .sort({ setNumber: -1 });

    if (incompleteSet) {
      const currentCount = incompleteSet.questionIds.length;
      const needed = questionsPerSet - currentCount;

      if (needed > 0 && questionsToProcess.length > 0) {
        // Take strictly sequential from the available pool to fill the gap
        const questionsToAdd = questionsToProcess.slice(0, needed);

        incompleteSet.questionIds.push(...questionsToAdd.map((q) => q._id));
        incompleteSet.totalQuestions = incompleteSet.questionIds.length;
        incompleteSet.isActive =
          incompleteSet.totalQuestions === questionsPerSet;
        await incompleteSet.save();

        console.log(
          `✅ Updated Set ${incompleteSet.setNumber}: ${incompleteSet.totalQuestions}/100`,
        );
        setsUpdated++;

        // Remove used questions
        questionsToProcess = questionsToProcess.slice(questionsToAdd.length);
      }
    }

    // 4. Create NEW SETS from remaining
    if (questionsToProcess.length > 0) {
      // Shuffle remaining for new sets
      const shuffledQuestions = [...questionsToProcess].sort(
        () => Math.random() - 0.5,
      );

      for (let i = 0; i < shuffledQuestions.length; i += questionsPerSet) {
        const setQuestions = shuffledQuestions.slice(i, i + questionsPerSet);
        const isActive = setQuestions.length === 100;

        // Get last set number to increment
        const lastSet = await this.questionSetModel
          .findOne({ chapterId: chapterObjectId, quizType: 'chapter' })
          .sort({ setNumber: -1 });

        const setNumber = (lastSet?.setNumber || 0) + 1;

        await this.questionSetModel.create({
          chapterId: chapterObjectId,
          unitId: unitId, // ⭐ ADD UNIT ID
          name: {
            hi: `सेट ${setNumber}`,
            en: `Set ${setNumber}`,
          },
          questionIds: setQuestions.map((q) => q._id),
          totalQuestions: setQuestions.length,
          setNumber: setNumber,
          quizType: 'chapter',
          isActive,
        });

        console.log(
          `✅ Created Chapter Set ${setNumber}: ${setQuestions.length}Q ${isActive ? '(ACTIVE)' : '(PENDING)'}`,
        );
        setsCreated++;
      }
    }

    return {
      success: true,
      totalQuestions: allQuestions.length,
      newlyAdded: allQuestions.length - usedQuestionIds.size,
      setsCreated,
      setsUpdated,
      activeSets: await this.questionSetModel.countDocuments({
        chapterId: chapterObjectId,
        isActive: true,
        quizType: 'chapter',
      }),
    };
  }

  async getSetsByUnit(
    unitId: string,
    options: {
      page?: number;
      limit?: number;
      activeOnly?: boolean;
      titleId?: string;
      quizType?: string;
    },
  ) {
    const {
      page = 1,
      limit = 10,
      activeOnly = false,
      titleId,
      quizType,
    } = options;
    const ObjectId = Types.ObjectId;

    if (!ObjectId.isValid(unitId)) {
      throw new BadRequestException(`Invalid unitId: ${unitId}`);
    }

    // 1. Find all chapters for this unit
    const chapters = await this.chapterModel
      .find({ unitId: new ObjectId(unitId) })
      .sort({ name: 1 })
      .lean();

    // 2. For each chapter, find its sets
    const chaptersWithSets = await Promise.all(
      chapters.map(async (chapter) => {
        const targetQuizType = quizType
          ? quizType
          : titleId
            ? 'title-chapter'
            : 'chapter';

        const query: any = {
          chapterId: chapter._id,
          quizType: targetQuizType,
        };
        if (titleId) {
          query.titleId = new ObjectId(titleId);
        }
        if (activeOnly) query.isActive = true;

        const sets = await this.questionSetModel
          .find(query)
          .select('name setNumber totalQuestions isActive')
          .sort({ setNumber: 1 })
          .lean();

        return {
          _id: chapter._id,
          name: chapter.name,
          code: chapter.code,
          sets: sets,
        };
      }),
    );

    return {
      unitId,
      chapters: chaptersWithSets,
    };
  }

  async getSetsByChapter(
    chapterId: string,
    options: { page?: number; limit?: number; activeOnly?: boolean },
  ) {
    const { page = 1, limit = 10, activeOnly = false } = options;
    const skip = (page - 1) * limit;

    // ⭐ 🔥 VALIDATION - ObjectId check FIRST
    const ObjectId = Types.ObjectId;
    if (!ObjectId.isValid(chapterId)) {
      throw new BadRequestException(
        `Invalid chapterId: ${chapterId}. Must be valid MongoDB ObjectId`,
      );
    }

    const match: any = {
      chapterId: new ObjectId(chapterId), // ✅ SAFE CONVERSION
      quizType: 'chapter',
    };

    if (activeOnly) {
      match.isActive = true;
    }

    const pipeline: any[] = [
      // ⭐ 1. MATCH - Chapter specific sets
      { $match: match },

      // ⭐ 2. LOOKUP - Chapter + Subject (Safe)
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapterId',
          foreignField: '_id',
          as: 'chapterDetails',
          pipeline: [
            {
              $lookup: {
                from: 'subjects',
                localField: 'subjectId',
                foreignField: '_id',
                as: 'subject',
                pipeline: [{ $project: { name: 1, code: 1 } }],
              },
            },
            { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: { $ifNull: ['$name.en', 'Unknown Unit'] },
                code: 1,
                subjectName: { $ifNull: ['$subject.name.en', 'Unknown'] },
              },
            },
          ],
        },
      },
      {
        $unwind: { path: '$chapterDetails', preserveNullAndEmptyArrays: true },
      },

      // ⭐ 3. PROJECT - Clean structure
      {
        $project: {
          _id: 1,
          name: 1,
          totalQuestions: 1,
          setNumber: 1,
          quizType: 1,
          isActive: 1,
          chapterName: '$chapterDetails.name',
          chapterCode: '$chapterDetails.code',
          subjectName: '$chapterDetails.subjectName',
          progress: {
            $round: [
              { $multiply: [{ $divide: ['$totalQuestions', 100] }, 100] },
              0,
            ],
          },
        },
      },

      // ⭐ 4. SORT + FACET
      { $sort: { setNumber: 1 } },
      {
        $facet: {
          sets: [{ $skip: skip }, { $limit: limit }],
          pagination: [{ $count: 'totalSets' }],
        },
      },
    ];

    const [result] = await this.questionSetModel.aggregate(pipeline);

    return {
      sets: result?.sets || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((result?.pagination[0]?.totalSets || 0) / limit),
        totalSets: result?.pagination[0]?.totalSets || 0,
        limit,
        hasNext:
          page < Math.ceil((result?.pagination[0]?.totalSets || 0) / limit),
        hasPrev: page > 1,
      },
    };
  }
  async getQuestionsBySetId(setId: string) {
    const ObjectId = Types.ObjectId;

    if (!ObjectId.isValid(setId)) {
      throw new BadRequestException(`Invalid setId: ${setId}`);
    }

    const pipeline: any[] = [
      // 1. MATCH QuestionSet
      { $match: { _id: new ObjectId(setId) } },

      // 2. LOOKUP Questions
      {
        $lookup: {
          from: 'questions',
          localField: 'questionIds',
          foreignField: '_id',
          as: 'questions',
          pipeline: [
            { $match: { status: 'active' } },
            { $sort: { questionNumber: 1 } },

            // Chapter lookup
            {
              $lookup: {
                from: 'chapters',
                localField: 'chapterId',
                foreignField: '_id',
                as: 'chapterData',
              },
            },
            {
              $unwind: {
                path: '$chapterData',
                preserveNullAndEmptyArrays: true,
              },
            },

            // Unit lookup
            {
              $lookup: {
                from: 'units',
                localField: 'chapterData.unitId',
                foreignField: '_id',
                as: 'unitData',
              },
            },
            {
              $unwind: { path: '$unitData', preserveNullAndEmptyArrays: true },
            },

            // Subject lookup
            {
              $lookup: {
                from: 'subjects',
                localField: 'unitData.subjectId',
                foreignField: '_id',
                as: 'subjectData',
              },
            },
            {
              $unwind: {
                path: '$subjectData',
                preserveNullAndEmptyArrays: true,
              },
            },

            // Project clean output
            {
              $project: {
                _id: 1,
                questionText: 1,
                options: 1,
                correctAnswer: 1,
                difficulty: 1,
                questionNumber: 1,
                explanation: 1, // ⭐ ADDED
                isPreviousYear: 1, // ⭐ ADDED
                previousExamCode: 1, // ⭐ ADDED
                correctOptionKey: 1, // ⭐ ADDED
                status: 1, // ⭐ ADDED
                createdAt: 1, // ⭐ ADDED
                updatedAt: 1, // ⭐ ADDED

                // ⭐ Full Details inside Question
                subjectDetails: {
                  _id: '$subjectData._id',
                  name: '$subjectData.name',
                  code: '$subjectData.code',
                },
                unitDetails: {
                  _id: '$unitData._id',
                  name: '$unitData.name',
                  code: '$unitData.code',
                },
                chapterDetails: {
                  _id: '$chapterData._id',
                  name: '$chapterData.name',
                  code: '$chapterData.code',
                },
              },
            },
          ],
        },
      },

      // Final output
      {
        $project: {
          setName: '$name',
          setNumber: 1,
          totalQuestions: { $size: '$questionIds' },
          questions: '$questions', // Array of questions with embedded details
        },
      },
    ]; // ✅ Correct closing of pipeline array

    const results = await this.questionSetModel.aggregate(pipeline);
    const result = results[0];

    return {
      success: true,
      data: result || {
        questions: [],
        setName: {},
        setNumber: 0,
        totalQuestions: 0,
      },
    };
  }

  async create(data: any) {
    // 1. Basic Validation
    if (!data.questionText || (!data.questionText.en && !data.questionText.hi)) {
      throw new BadRequestException('Question text is required (en or hi)');
    }

    // 2. Validate ObjectIds and Existence
    const checks: Promise<any>[] = [];
    if (data.subjectId) {
      if (!Types.ObjectId.isValid(data.subjectId)) throw new BadRequestException('Invalid subjectId');
      checks.push(this.subjectModel.exists({ _id: data.subjectId }).then(exists => {
        if (!exists) throw new NotFoundException(`Subject not found: ${data.subjectId}`);
      }));
    }
    if (data.unitId) {
      if (!Types.ObjectId.isValid(data.unitId)) throw new BadRequestException('Invalid unitId');
      checks.push(this.unitModel.exists({ _id: data.unitId }).then(exists => {
        if (!exists) throw new NotFoundException(`Unit not found: ${data.unitId}`);
      }));
    }
    if (data.chapterId) {
      if (!Types.ObjectId.isValid(data.chapterId)) throw new BadRequestException('Invalid chapterId');
      checks.push(this.chapterModel.exists({ _id: data.chapterId }).then(exists => {
        if (!exists) throw new NotFoundException(`Chapter not found: ${data.chapterId}`);
      }));
    }

    await Promise.all(checks);

    // 3. Validate Options
    if (data.options && Array.isArray(data.options)) {
      const validKeys = data.options.map((o: any) => o.key);
      if (data.correctOptionKey && !validKeys.includes(data.correctOptionKey)) {
        throw new BadRequestException(`Invalid correctOptionKey. Must be one of: ${validKeys.join(', ')}`);
      }
    }

    const newQuestion = new this.questionModel(data);
    return await newQuestion.save();
  }

  async update(id: string, data: any) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Question ID');

    // Validate related entities if they are being updated
    const checks: Promise<any>[] = [];
    if (data.subjectId) {
      if (!Types.ObjectId.isValid(data.subjectId)) throw new BadRequestException('Invalid subjectId');
      checks.push(this.subjectModel.exists({ _id: data.subjectId }).then(exists => {
        if (!exists) throw new NotFoundException(`Subject not found: ${data.subjectId}`);
      }));
    }
    // Add other checks if needed, similar to create

    await Promise.all(checks);

    const updated = await this.questionModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Question not found');
    return updated;
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid Question ID');
    const deleted = await this.questionModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Question not found');
    return deleted;
  }
}
