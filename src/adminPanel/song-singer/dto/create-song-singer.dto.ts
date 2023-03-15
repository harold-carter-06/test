import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class CreateSongSingerDto { 
  @ApiProperty()
  @IsString()
  songId: string;

  @ApiProperty()
  @IsString()
  singerId: string;
}


export class SongSingerDto{
  @ApiProperty()
  id: string;
}
export class SongSingerSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SongSingerDto;
}

export class SongSingerErrorResponse {

  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetSongSingerDto{
  @ApiProperty()
  id: string;
}