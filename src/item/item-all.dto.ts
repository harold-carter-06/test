import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsNumber,
  IsArray,
} from 'class-validator';
import { FieldTypes } from './item-types';
import { Item } from './models/item.model';
import { ApiProperty } from '@nestjs/swagger';
export class addItemDTO {
  @IsNumber()
  cost: number;
  @IsNumber()
  cost_decimals: number;

  @IsNumber()
  markup_percent: number;

  @IsString()
  name: string;

  @IsString()
  desc: string;

  @IsString()
  type: string;

  @IsArray()
  fields: any[];
}

export class deleteItemDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class getAllItemsParamsDTO {
  @ApiProperty({
    default: 0,
  })
  page: number;

  @ApiProperty({
    default: 10,
  })
  limit: number;

  @ApiProperty({
    default: 'asc',
    example: 'asc || desc',
  })
  sortType: string;

  @ApiProperty({
    default: 'name',
  })
  sortField: string;

  @ApiProperty({
    default: 'SERVICE',
    required: false,
  })
  searchType: string;
}
export class updateItemDTO {
  @IsNumber()
  cost: number;
  @IsNumber()
  cost_decimals: number;

  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  desc: string;

  @IsString()
  type: string;

  @IsArray()
  fields: any[];

  @IsNumber()
  markup_percent: number;
}
export interface getAllItemResponse {
  page: number;
  data: Item[];
  total_count: number;
}
export interface ProductItem {
  type: string;
  name: string;
  cost: number;
  cost_decimals: number;
  desc: string;
  fields: ICustomFields[];
  id: string;
  createdByUser?: string;
  createdByUserId?: string;
}
export interface OrderProductItem extends ProductItem {
  total_cost?: string;
  sub_total_cost?: string;
  quantity?: number;
  notes?: string;
  before_images?: string[];
  after_images?: string;
}

export interface ICustomFields {
  type: FieldTypes;
  prefillValue: string;
  required: boolean;
  label: string;
  dropdown_options?: string[];
  radio_options?: string[];
}

export class importCSVDto {
  @ApiProperty({ type: 'file' })
  file: string;
}
