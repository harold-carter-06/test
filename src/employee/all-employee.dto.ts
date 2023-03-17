import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { RoleTypes } from '../roles.decorator';
import { Employee } from './models/employee.model';

export interface IGetAllEmployeeDataResponse {
  page: number;
  data: Employee[];
  total_count: number;
}
export class addEmployeeDTO {
  @IsString()
  first_name: string;
  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone_number: string;

  @IsArray()
  access_level: RoleTypes[];

  @IsArray()
  @IsOptional()
  locationIds: string[];

  @IsArray()
  @IsOptional()
  employeeGroupIds: string[];
}

export class deleteEmployeeDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class updateEmployeeDTO {
  @IsString()
  id: string;
  @IsString()
  first_name: string;
  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone_number: string;

  @IsArray()
  access_level: RoleTypes[];

  @IsArray()
  @IsOptional()
  locationIds: string[];

  @IsArray()
  @IsOptional()
  employeeGroupIds: string[];
}
