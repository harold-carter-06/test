import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  BadRequestException,
  UseFilters,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { SingerService } from "./singer.service";
import {
  CreateSingerDto,
  SingerSuccessResponse,
  SingerErrorResponse,
  GetSingerDto,
} from "./dto/create-singer.dto";
import {
  ListSingerSuccessResponse,
  ListSingerErrorResponse,
  GetSingerSuccessResponse,
  GetSingerErrorResponse,
} from "./dto/list-singer.dto";
import { UpdateSingerDto, GetSingerIdDto } from "./dto/update-singer.dto";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  GeneralHelperService,
  HttpExceptionFilter,
  Message,
  HttpStatus,
  ErrorCode,
} from "../../common/index.service";

import {
  DeleteSingerSuccessResponse,
  DeleteSingerErrorResponse,
} from "./dto/delete-singer.dto";

import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
const send = GeneralHelperService.sendResponse;
@ApiTags("Admin/singer")
@ApiBearerAuth("JWT")
@Controller("admin/singer")
@UseFilters(new HttpExceptionFilter())
export class SingerController {
  constructor(private readonly singerService: SingerService) { }

  @Post()
  @UseFilters(new HttpExceptionFilter())
  @UseInterceptors(FileFieldsInterceptor([{ name: 'path', maxCount: 1 }, { name: 'image', maxCount: 1 },], {
    storage: diskStorage({
      destination: './uploads',
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
  @ApiOperation({ summary: "Add new singer" })
  @ApiResponse({ status: 200, type: SingerSuccessResponse })
  @ApiResponse({ status: 400, type: SingerErrorResponse })
  async create(@Res() res: any,
    @UploadedFiles() file: Express.Multer.File,
    @Body() createSingerDto: CreateSingerDto) {
    const singer: any = await this.singerService.create(createSingerDto, file);
    if (singer) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { "id": singer });
    }
    throw new BadRequestException(ErrorCode.ALREADY_EXIST_CODE, Message.SINGER_EXIT_MESSAGE);
  }

  @Get()
  @ApiOperation({ summary: "List of singer" })
  @ApiResponse({ status: 200, type: ListSingerSuccessResponse })
  @ApiResponse({ status: 400, type: ListSingerErrorResponse })
  async findAll(@Res() res: any) {
    const singer = await this.singerService.findAll();
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { list: singer });
  }

  @Get("get/:id")
  @ApiOperation({ summary: "Get singer" })
  @ApiResponse({ status: 200, type: GetSingerSuccessResponse })
  @ApiResponse({ status: 400, type: GetSingerErrorResponse })
  async findOne(@Res() res: any, @Param() GetSingerId: GetSingerDto) {
    const getSinger = await this.singerService.findOne(GetSingerId.id);
    if (getSinger) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, getSinger);
    }
    throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
  }

  @Patch("update/:id")
  @UseFilters(new HttpExceptionFilter())
  @UseInterceptors(FileFieldsInterceptor([{ name: 'path', maxCount: 1 }, { name: 'image', maxCount: 1 },], {
    storage: diskStorage({
      destination: './uploads',
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
  @ApiOperation({ summary: "Update singer" })
  @ApiResponse({ status: 200, type: SingerSuccessResponse })
  @ApiResponse({ status: 400, type: SingerErrorResponse })
  async update(
    @Res() res: any,
    @Param() GetSingerId: GetSingerIdDto,
    @Body() updateSingerDto: UpdateSingerDto,
    @UploadedFiles() file: Express.Multer.File,
  ) {
    const singerUpdate = await this.singerService.update(
      GetSingerId.id,
      updateSingerDto,
      file
    );
    if (singerUpdate) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: singerUpdate });
    }
    throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete singer" })
  @ApiResponse({ status: 200, type: DeleteSingerSuccessResponse })
  @ApiResponse({ status: 400, type: DeleteSingerErrorResponse })
  async remove(@Res() res: any, @Param() GetSingerId: GetSingerIdDto) {
    const deleteSinger = await this.singerService.remove(GetSingerId.id);
    if (deleteSinger) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, null);
    }
    throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
  }
}
