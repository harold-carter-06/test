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
import { Invoice } from './models/invoice.model';

export interface IGetAllInvoicesDataResponse {
  page: number;
  data: Invoice[];
  total_count: number;
}

export interface BillingDetails {
  total_amount: string;
  tax_rate: string;
  tax_amount: string;
  items_total: string;
  discount_total: string;
}
export class getAllInvoicesDTO {
  @IsNumber()
  @IsOptional()
  invoice_start_date: string;

  @IsNumber()
  @IsOptional()
  invoice_end_date: string;
}
export class addInvoiceDTO {
  @IsString()
  @IsOptional()
  order_id: string;
  @IsString()
  customer_ref_id: string;

  @IsArray()
  invoice_items: any[];

  @IsNumber()
  invoice_due_date: number;

  @IsString()
  invoice_notes_external: string;

  @IsArray()
  invoice_items_additional: any[];

  @IsObject()
  @IsOptional()
  invoice_billing_details: any;

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

  @IsBoolean()
  invoice_payment_completed;
}

export class deleteInvoiceDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
export class updateInvoiceDTO {
  @IsString()
  @IsOptional()
  order_id: string;
  @IsString()
  id: string;

  @IsString()
  customer_ref_id: string;

  @IsNumber()
  invoice_due_date: number;

  @IsString()
  invoice_notes_external: string;

  @IsArray()
  invoice_items: any[];

  @IsArray()
  invoice_items_additional: any[];

  @IsObject()
  @IsOptional()
  invoice_billing_details: any;

  @IsString()
  custom_email: string;
  @IsBoolean()
  send_text: boolean;
  @IsBoolean()
  send_email: boolean;
  @IsBoolean()
  send_custom_email: boolean;

  @IsArray()
  tags: string[];

  @IsBoolean()
  invoice_payment_completed;
}
