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
  IsMongoId,
} from 'class-validator';
import { Order } from './models/order.model';
import { ObjectId } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export interface IGetAllOrdersDataResponse {
  page: number;
  data: Order[];
  total_count: number;
}
export interface IGetAllOrdersDataResponseForCalendar {
  data: Order[];
  total_count: number;
}
export interface BillingDetails {
  total_amount: string;
  tax_rate: string;
  tax_amount: string;
  items_total: string;
  discount_total: string;
}
export class getAllOrdersDTO {
  @IsNumber()
  @IsOptional()
  order_start_date: string;

  @IsNumber()
  @IsOptional()
  order_end_date: string;
}
export class addOrderDTO {
  @IsString()
  customer_ref_id: string;

  @IsString()
  calendar_color: string;

  @IsNumber()
  @IsOptional()
  order_job_end_timestamp?: number;
  @IsNumber()
  @IsOptional()
  order_job_start_timestamp?: number;

  @IsArray()
  order_items: any[];

  @IsArray()
  order_items_additional: any[];

  @IsBoolean()
  order_payment_completed: boolean;

  @IsObject()
  @IsOptional()
  order_billing_details: any;

  @IsBoolean()
  link_notes_to_related_invoice: boolean;

  @IsArray()
  tags: string[];

  @IsString()
  @IsOptional()
  notes: string;

  @IsString()
  custom_email: string;
  @IsBoolean()
  send_text: boolean;
  @IsBoolean()
  send_email: boolean;
  @IsBoolean()
  send_custom_email: boolean;
  @IsBoolean()
  show_job_time_checkbox: boolean;

  @IsMongoId({ each: true })
  team: ObjectId[];
}

export class deleteOrderDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class bulkUpdateOrdersDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
export class updateOrderDTO {
  @IsString()
  id: string;

  @IsString()
  customer_ref_id: string;

  @IsNumber()
  @IsOptional()
  order_job_end_timestamp?: number;
  @IsNumber()
  @IsOptional()
  order_job_start_timestamp?: number;

  @IsString()
  calendar_color: string;

  @IsArray()
  order_items: any[];

  @IsArray()
  order_items_additional: any[];

  @IsBoolean()
  order_payment_completed: boolean;

  @IsBoolean()
  show_job_time_checkbox: boolean;

  @IsString()
  @IsOptional()
  notes: string;

  @IsString()
  custom_email: string;
  @IsBoolean()
  send_text: boolean;
  @IsBoolean()
  send_email: boolean;
  @IsBoolean()
  send_custom_email: boolean;

  @IsObject()
  @IsOptional()
  order_billing_details: any;

  @IsArray()
  tags: string[];

  @IsMongoId({ each: true })
  team: ObjectId[];
}

export class getOrdersParamDTO {
  @ApiProperty({
    default: 0,
  })
  @IsString()
  page: string;

  @ApiProperty({
    default: 10,
  })
  @IsString()
  limit: string;

  @ApiProperty()
  @IsString()
  start_date: string;

  @ApiProperty()
  @IsString()
  end_date: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiProperty()
  @IsString()
  search_term: string;

  @ApiProperty({ example: 'all' })
  @IsEnum([
    'all',
    'require_invoice',
    'all_active',
    'action_required',
    'late_visit',
    'today',
    'upcoming_visit',
    'unscheduled_visit',
    'ending_thirty_days',
    'archived',
  ])
  type: string;
}
