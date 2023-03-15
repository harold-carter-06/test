import { ListCategorySuccessResponse, ListCategoryErrorResponse, GetCategorySuccessResponse, GetCategoryErrorResponse, ListCategoryNameSuccessResponse, ListCategoryNameErrorResponse, SetSerachAndPagination, } from "./dto/list-category.dto";
import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseFilters, InternalServerErrorException, UseInterceptors, UploadedFiles, Query } from "@nestjs/common";
import { CreateCategoryDto, CategorySuccessResponse, CategoryErrorResponse, GetCategoryDto, } from "./dto/create-category.dto";
import { GeneralHelperService, HttpExceptionFilter, Message, HttpStatus } from "../../common/index.service";
import { DeleteCategorySuccessResponse, DeleteCategoryErrorResponse, } from "./dto/delete-category.dto";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags, } from "@nestjs/swagger";
import { UpdateCategoryDto, GetCategoryIdDto, UpdateCategoryStatusDto } from "./dto/update-category.dto";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { CategoryService } from "./category.service";
import { diskStorage } from "multer";
import { extname } from "path";
const send = GeneralHelperService.sendResponse;
@ApiTags("Admin/Category")
@ApiBearerAuth("JWT")
@Controller("admin/category")
@UseFilters(new HttpExceptionFilter())

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  // This api is used for adding new category for the song
  @Post()
  @ApiOperation({ summary: "Add new category" })
  @ApiResponse({ status: 200, type: CategorySuccessResponse })
  @ApiResponse({ status: 400, type: CategoryErrorResponse })

  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], {
    storage: diskStorage({
      destination: './uploads/category',
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('')
        return cb(null, `${randomName}${extname(file.originalname)}`)
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  async create(@Res() res: any, @UploadedFiles() file: Express.Multer.File, @Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryService.create(createCategoryDto, file);
    if (category) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: category });
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
  }

  // This api is used for listing all categories
  @Get()
  @ApiOperation({ summary: "List of categories" })
  @ApiResponse({ status: 200, type: ListCategorySuccessResponse })
  @ApiResponse({ status: 400, type: ListCategoryErrorResponse })
  async findAll(@Res() res: any, @Query() setSearchAndPagination: SetSerachAndPagination) {
    const category = await this.categoryService.findAll(setSearchAndPagination);
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, category);
  }

  // This api is used for get vategory by id
  @Get(":id")
  @ApiOperation({ summary: "Get category" })
  @ApiResponse({ status: 200, type: GetCategorySuccessResponse })
  @ApiResponse({ status: 400, type: GetCategoryErrorResponse })
  async findOne(@Res() res: any, @Param() GetCategoryId: GetCategoryDto) {
    const getCategory = await this.categoryService.findOne(GetCategoryId.id);
    if (getCategory) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, getCategory);
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
  }

  // This api is used for update category
  @Patch(":id")
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], {
    storage: diskStorage({
      destination: './uploads/category',
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('')
        return cb(null, `${randomName}${extname(file.originalname)}`)
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "Update category" })
  @ApiResponse({ status: 200, type: CategorySuccessResponse })
  @ApiResponse({ status: 400, type: CategoryErrorResponse })
  async update(
    @Res() res: any,
    @UploadedFiles() file: Express.Multer.File,
    @Param() GetCategoryId: GetCategoryIdDto,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    const categoryUpdate = await this.categoryService.update(GetCategoryId.id, updateCategoryDto, file);
    if (categoryUpdate) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: categoryUpdate });
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
  }

  // This api is used for deleting the category
  @Delete(":id")
  @ApiOperation({ summary: "Delete category" })
  @ApiResponse({ status: 200, type: DeleteCategorySuccessResponse })
  @ApiResponse({ status: 400, type: DeleteCategoryErrorResponse })
  async remove(@Res() res: any, @Param() GetCategoryId: GetCategoryIdDto) {
    const deleteCategory = await this.categoryService.remove(GetCategoryId.id);
    if (deleteCategory) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, null);
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
  }

  // This api is used for listing all categories names
  @Get('name/list')
  @ApiOperation({ summary: "List of categories names" })
  @ApiResponse({ status: 200, type: ListCategoryNameSuccessResponse })
  @ApiResponse({ status: 400, type: ListCategoryNameErrorResponse })
  async findCategoryName(@Res() res: any) {
    console.log('data');
    const category = await this.categoryService.findAllCategoryName();
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { list: category });
  }

  @Patch("status/:id")
  @UseFilters(new HttpExceptionFilter())
  @ApiOperation({ summary: "Update category" })
  @ApiResponse({ status: 200, type: CategorySuccessResponse })
  @ApiResponse({ status: 400, type: CategoryErrorResponse })
  async updateStatus(
    @Res() res: any,
    @Param() GetCategoryId: GetCategoryIdDto,
    @Body() updateCategoryStatusDto: UpdateCategoryStatusDto
  ) {
    const categoryStatusUpdate = await this.categoryService.updateStatus(GetCategoryId.id, updateCategoryStatusDto);
    if (categoryStatusUpdate) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: categoryStatusUpdate });
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG);
  }
}
