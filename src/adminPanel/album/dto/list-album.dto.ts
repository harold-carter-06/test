import { ApiProperty } from "@nestjs/swagger";

export class AlbumDataList {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isFocus: boolean;

  @ApiProperty()
  isTrending: boolean;

  @ApiProperty()
  isActive: boolean;
}
export class AlbumListData {
  @ApiProperty({
    type: [AlbumDataList],
  })
  list: AlbumDataList[];
}
export class ListAlbumSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: AlbumListData;
}

export class ListAlbumErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetAlbumDto {
  @ApiProperty()
  id: string;
}

export class getAlbumData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
export class GetAlbumSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: getAlbumData;
}

export class GetAlbumErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}
