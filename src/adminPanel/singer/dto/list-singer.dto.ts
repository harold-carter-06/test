import { ApiProperty } from "@nestjs/swagger";

export class SingerDataList {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}
export class SingerListData {
  @ApiProperty({
    type: [SingerDataList],
  })
  list: SingerDataList[];
}
export class ListSingerSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SingerListData;
}

export class ListSingerErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetSingerDto {
  @ApiProperty()
  id: string;
}

export class getSingerData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
export class GetSingerSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: getSingerData;
}

export class GetSingerErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}
