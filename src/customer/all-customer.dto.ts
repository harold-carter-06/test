import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Customer } from './models/customer.model';

export interface IGetAllCustomerDataResponse {
  page: number;
  data: Customer[];
  total_count: number;
}
export class addCustomerDTO {
  @IsEmail()
  email: string;
  @IsString()
  @IsOptional()
  first_name: string;
  @IsString()
  @IsOptional()
  last_name: string;
  @IsString()
  @IsOptional()
  address_line_1: string;
  @IsString()
  @IsOptional()
  address_line_2: string;
  @IsString()
  @IsOptional()
  mobile_country_code: string;
  @IsString()
  @IsOptional()
  phone_number: string;
  @IsString()
  @IsOptional()
  phone_number_alt: string;
  @IsString()
  @IsOptional()
  city: string;
  @IsString()
  @IsOptional()
  country: string;
  @IsString()
  @IsOptional()
  post_code: string;
  @IsString()
  @IsOptional()
  channel: string;
  @IsArray()
  @IsOptional()
  tags: string[];
  @IsString()
  suffix: string;
}

export class deleteCustomerDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class updateCustomerDTO {
  @IsEmail()
  email: string;
  @IsString()
  @IsOptional()
  first_name: string;
  @IsString()
  id: string;
  @IsString()
  @IsOptional()
  last_name: string;
  @IsString()
  @IsOptional()
  address_line_1: string;
  @IsString()
  @IsOptional()
  address_line_2: string;
  @IsString()
  @IsOptional()
  mobile_country_code: string;
  @IsString()
  @IsOptional()
  phone_number: string;

  @IsString()
  @IsOptional()
  phone_number_alt: string;
  @IsString()
  @IsOptional()
  city: string;
  @IsString()
  @IsOptional()
  country: string;
  @IsString()
  @IsOptional()
  post_code: string;
  @IsString()
  @IsOptional()
  channel: string;
  @IsArray()
  @IsOptional()
  tags: string[];
  @IsString()
  suffix: string;
}
