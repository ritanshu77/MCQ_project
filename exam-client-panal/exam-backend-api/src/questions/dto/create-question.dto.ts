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
  // ✅ SUBJECT FIELDS
  @IsString()
  subjectName: string; // "Computer Science"

  @IsOptional()
  @IsString()
  subjectDescriptionHi?: string; // "कंप्यूटर साइंस - DBMS, Networking"

  @IsOptional()
  @IsString()
  subjectDescriptionEn?: string; // "Computer Science - DBMS, Networking"

  // ✅ UNIT FIELDS
  @IsString()
  unitName: string; // "DBMS"

  @IsOptional()
  @IsString()
  unitDescriptionHi?: string; // "Database Management System"

  @IsOptional()
  @IsString()
  unitDescriptionEn?: string; // "Database Management System"

  // ✅ CHAPTER FIELDS (topicName → chapterName)
  @IsString()
  chapterName: string; // "SSL Protocol"

  @IsOptional()
  @IsString()
  chapterDescriptionHi?: string; // "SSL/TLS encryption"

  @IsOptional()
  @IsString()
  chapterDescriptionEn?: string; // "SSL/TLS encryption"

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
  previousExamCode?: string; // "PTWAR-2021"
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
