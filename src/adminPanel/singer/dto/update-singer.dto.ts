import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";
import { CreateSingerDto } from "./create-singer.dto";

export class UpdateSingerDto extends PartialType(CreateSingerDto) {}

export class GetSingerIdDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}
