import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class addTaskDTO {
  @IsString()
  description: string;

  @IsString()
  title: string;

  @IsString()
  calendar_color: string;

  @IsArray()
  employee_ids: string[];

  @IsArray()
  location_ids: string[];

  @IsArray()
  customer_ids: string[];

  @IsNumber()
  task_calendar_timestamp: number;

  @IsNumber()
  reminder_timestamp: number;

  @IsBoolean()
  should_remind: boolean;
}

export class deleteTaskDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class updateTaskDTO {
  @IsString()
  description: string;

  @IsString()
  title: string;

  @IsString()
  calendar_color: string;

  @IsArray()
  employee_ids: string[];

  @IsArray()
  location_ids: string[];

  @IsArray()
  customer_ids: string[];

  @IsNumber()
  task_calendar_timestamp: number;

  @IsNumber()
  reminder_timestamp: number;

  @IsBoolean()
  should_remind: boolean;

  @IsString()
  id: string;
}
