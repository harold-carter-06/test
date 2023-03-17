import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNumber,
  IsArray,
  isArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Estimate } from './models/estimate.model';

export interface IGetAllEstimatesDataResponse {
  page: number;
  data: Estimate[];
  total_count: number;
}

export interface BillingDetails {
  total_amount: string;
  tax_rate: string;
  tax_amount: string;
  items_total: string;
  discount_total: string;
}
export class getAllEstimatesDTO {
  @IsNumber()
  @IsOptional()
  estimate_start_date: string;

  @IsNumber()
  @IsOptional()
  estimate_end_date: string;
}
export class addEstimateDTO {
  @IsString()
  @IsOptional()
  order_id: string;
  @IsString()
  customer_ref_id: string;

  @IsString()
  estimate_notes_external: string;

  @IsArray()
  estimate_items: any[];

  @IsArray()
  estimate_items_additional: any[];

  @IsObject()
  @IsOptional()
  estimate_billing_details: any;

  @IsArray()
  tags: string[];

  @IsString()
  custom_email: string;
  @IsBoolean()
  send_text: boolean;
  @IsBoolean()
  send_email: boolean;
  @IsBoolean()
  send_custom_email: boolean;
}

export class deleteEstimateDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class updateEstimateDTO {
  @IsString()
  @IsOptional()
  order_id: string;
  @IsString()
  id: string;

  @IsString()
  customer_ref_id: string;

  @IsString()
  estimate_notes_external: string;

  @IsArray()
  estimate_items: any[];

  @IsArray()
  estimate_items_additional: any[];

  @IsObject()
  @IsOptional()
  estimate_billing_details: any;

  @IsArray()
  tags: string[];

  @IsString()
  custom_email: string;
  @IsBoolean()
  send_text: boolean;
  @IsBoolean()
  send_email: boolean;
  @IsBoolean()
  send_custom_email: boolean;
}
