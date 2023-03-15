import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString } from "class-validator";

export class CreateSingerDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ type: 'file' })
  image: string;
}

export class SingerData {
  @ApiProperty()
  id: string;
}
export class SingerSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SingerData;
}

export class SingerErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetSingerDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}
