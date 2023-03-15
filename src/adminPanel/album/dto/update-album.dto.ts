import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";
import { CreateAlbumDto } from "./create-album.dto";

export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {}

export class GetAlbumIdDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}
