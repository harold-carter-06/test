import { ApiProperty } from "@nestjs/swagger";

export class DeleteSingerSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class DeleteSingerErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}
