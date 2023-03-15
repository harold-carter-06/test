import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsString, MinLength } from "class-validator";

export class CreateAlbumDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ type: 'file' })
  image: string;
}

export class AlbumData {
  @ApiProperty()
  id: string;
}
export class AlbumSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: AlbumData;
}

export class AlbumErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetAlbumDto {
  @ApiProperty()
  @IsMongoId()
  id: string;
}
