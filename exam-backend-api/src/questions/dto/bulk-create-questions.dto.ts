import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class OptionDto {
  @IsString()
  key: string; // A, B, C, D

  @IsString()
  textHi: string;

  @IsString()
  textEn: string;
}

export class QuestionDto {
  // ✅ SUBJECT FIELDS (Complete)
  @IsString()
  subjectName: string; // "Computer Science"

  @IsOptional()
  @IsString()
  subjectDescriptionHi?: string;

  @IsOptional()
  @IsString()
  subjectDescriptionEn?: string;

  // ✅ UNIT FIELDS (Complete)
  @IsString()
  unitName: string; // "DBMS"

  @IsOptional()
  @IsString()
  unitDescriptionHi?: string;

  @IsOptional()
  @IsString()
  unitDescriptionEn?: string;

  // ✅ CHAPTER FIELDS (topicName → chapterName)
  @IsString()
  chapterName: string; // "SSL Protocol"

  @IsOptional()
  @IsString()
  chapterDescriptionHi?: string;

  @IsOptional()
  @IsString()
  chapterDescriptionEn?: string;

  // ✅ QUESTION FIELDS
  @IsString()
  questionTextHi: string;

  @IsString()
  questionTextEn: string;

  @IsOptional()
  @IsNumber()
  questionNumber?: number;

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => OptionDto)
  options: OptionDto[];

  @IsString()
  correctOptionKey: string; // "A", "B", "C", "D"

  @IsOptional()
  @IsString()
  explanationHi?: string;

  @IsOptional()
  @IsString()
  explanationEn?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsBoolean()
  isPreviousYear?: boolean;

  @IsOptional()
  @IsString()
  previousExamCode?: string;
}

export class BulkCreateQuestionsDto {
  @IsOptional()
  @IsString()
  title?: string; // "Networking 500 Questions"

  @IsOptional()
  @IsString()
  exam?: string; // "RAS 2025 Mains"

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
