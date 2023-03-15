import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @ToBoolean()
  inFocus: boolean;

  @ApiProperty()
  @ToBoolean()
  inTrending: boolean;

  @ApiProperty({ type:'file' })
  image: string;
}

export class CategoryData {
  @ApiProperty()
  id: string;
}
export class CategorySuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: CategoryData;
}

export class CategoryErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetCategoryDto {
  @ApiProperty()
  id: string;
}

export function ToBoolean(): (target: any, key: string) => void {
  return Transform((value: any) => value === 'true' || value === true || value === 1 || value === '1');
}