import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) { }
export class GetCategoryIdDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}

export class UpdateCategoryStatusDto {
  @ApiProperty({ example: "active:true || inActive:false" })
  @IsBoolean()
  status: string;
}

export function ToBoolean(): (target: any, key: string) => void {
  return Transform((value: any) => value === 'true' || value === true || value === 1 || value === '1');
}


