import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class CreateSongDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsMongoId()
  categoryId: string;

  @ApiProperty({ type:'file' })
  path: string;

  @ApiProperty({ type:'file' })
  coverImage: number;

}
export class SongDto {
  @ApiProperty()
  id: string;
}
export class SongSuccessResponse{
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SongDto;
}

export class SongErrorResponse{
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SongDto;
}



