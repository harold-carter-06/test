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
import { Location } from './model/location.model';

export interface IGetAllLocationDataResponse {
  page: number;
  data: Location[];
  total_count: number;
}
export class addLocationDto {
  @IsEmail()
  @IsOptional()
  business_email: string;
  @IsString()
  location_name: string;

  @IsString()
  @IsOptional()
  address_line_1: string;
  @IsString()
  @IsOptional()
  address_line_2: string;
  @IsString()
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
  @IsOptional()
  google_address_id: string;
  @IsString()
  @IsOptional()
  google_my_business_id: string;
  @IsString()
  @IsOptional()
  instagram_profile: string;
  @IsString()
  @IsOptional()
  facebook_profile: string;
  @IsString()
  @IsOptional()
  notes: string;
}

export class deleteLocationDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class updateLocationDTO {
  @IsString()
  id: string;
  @IsEmail()
  @IsOptional()
  business_email: string;
  @IsString()
  location_name: string;

  @IsString()
  @IsOptional()
  address_line_1: string;
  @IsString()
  @IsOptional()
  address_line_2: string;
  @IsString()
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
  @IsOptional()
  google_address_id: string;
  @IsString()
  @IsOptional()
  google_my_business_id: string;
  @IsString()
  @IsOptional()
  instagram_profile: string;
  @IsString()
  @IsOptional()
  facebook_profile: string;
  @IsString()
  @IsOptional()
  notes: string;
}
