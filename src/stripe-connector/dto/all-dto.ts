import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class subscriptionDto {
  @ApiProperty({ example: 'free' })
  @IsEnum(['free', 'annual'])
  @IsNotEmpty()
  planType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expMonth: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  expYear: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cvv: string;
}

export class getAllPaymentsParamsDTO {
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
    default: 'name',
  })
  searchBydays: string;
}
