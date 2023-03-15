import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CategoryDataList {
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
export class CategoryListData {
  @ApiProperty({
    type: [CategoryDataList],
  })
  list: CategoryDataList[];

  @ApiProperty({example:3})
  perPage: number;

  @ApiProperty({example:3})
  page: number;

  @ApiProperty({example:3})
  totalRecords: number;

  @ApiProperty({example:3})
  totalPages: number;

}
export class ListCategorySuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: CategoryListData;
}

export class ListCategoryErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}

export class GetCategoryDto {
  @ApiProperty()
  id: string;
}

export class getCategoryData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}
export class GetCategorySuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: getCategoryData;
}

export class GetCategoryErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}


export class CategoryNameDataList {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}
export class CategoryNameListData {
  @ApiProperty({
    type: [CategoryNameDataList],
  })
  list: CategoryNameDataList[];
}
export class ListCategoryNameSuccessResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: CategoryNameListData;
}

export class ListCategoryNameErrorResponse {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;
}
export class SetSerachAndPagination {
  @ApiPropertyOptional()
  sort: number;

  @ApiPropertyOptional()
  page: number;

  @ApiPropertyOptional()
  perPage: number;
}


