import { ApiProperty } from '@nestjs/swagger';

export class GetSongDto {
  @ApiProperty()
  id: string;
}

export class GetSongData{
  @ApiProperty({example:"new"})
  title: string;

  @ApiProperty({example:"trial"})
  description: string;

  @ApiProperty({example:"6385ef678737f4c5bde98b78"})
  categoryId: string;

  @ApiProperty({example:"6385ef678737f4c5bde98b78"})
  id: string;

  @ApiProperty({example:"http://localhost:8000/uploads/55701192b9f8503c402825ac1f7f610f6.png"})
  coverImage: string;

  @ApiProperty({example:"http://localhost:8000/uploads/55701192b9f8503c402825ac1f7f610f6.png"})
  songPath: string;
}

export class GetsongSuccessResponse{
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: GetSongData;
}

export class GetsongErrorResponse{
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class ListsongSuccessResponse{
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty({
    type: [GetSongData],
  })
  data: GetSongData[];
}

export class ListsongErrorResponse{
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

