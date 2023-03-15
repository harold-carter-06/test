import { ApiProperty } from "@nestjs/swagger";

export class DeleteCategorySuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class DeleteCategoryErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}
