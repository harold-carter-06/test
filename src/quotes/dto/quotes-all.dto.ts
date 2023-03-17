import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsMongoId,
  IsObject,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { Quotes } from '../models/quotes.model';

export class deleteQuoteDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class addQuoteDTO {
  @IsString()
  job_title: string;

  @IsString()
  customer_ref_id: string;

  @IsArray()
  quote_items: any[];

  @IsArray()
  quote_items_additional: any[];

  @IsObject()
  @IsOptional()
  quote_billing_details: any;

  @IsString()
  @IsOptional()
  quotes_notes_external: string;

  @IsBoolean()
  send_text: boolean;

  @IsBoolean()
  send_email: boolean;

  @IsBoolean()
  convert_to_job: boolean;
}

export class updateQuoteDTO {
  @IsString()
  id: string;

  @IsString()
  job_title: string;

  @IsString()
  customer_ref_id: string;

  @IsArray()
  quote_items: any[];

  @IsArray()
  quote_items_additional: any[];

  @IsObject()
  @IsOptional()
  quote_billing_details: any;

  @IsBoolean()
  send_text: boolean;

  @IsBoolean()
  send_email: boolean;

  @IsBoolean()
  convert_to_job: boolean;

  @IsString()
  @IsOptional()
  quotes_notes_external: string;
}
export interface IGetAllQuotesDataResponse {
  page: number;
  data: Quotes[];
  total_count: number;
}
export class getAllquotesParamsDTO {
  @ApiProperty({
    default: 0,
  })
  page: number;

  @ApiProperty({
    default: 10,
  })
  limit: number;

  @ApiProperty({
    required: false,
  })
  search_term: string;
}
export interface ProductItem {
  type: string;
  name: string;
  cost: number;
  cost_decimals: number;
  desc: string;
  id: string;
  createdByUser?: string;
  createdByUserId?: string;
}

export interface BillingDetails {
  total_amount: string;
  tax_rate: string;
  tax_amount: string;
  items_total: string;
  discount_total: string;
}
