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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AlbumService } from "./album.service";
import { GetAlbumIdDto, UpdateAlbumDto } from "./dto/update-album.dto";
import {
  CreateAlbumDto,
  AlbumSuccessResponse,
  AlbumErrorResponse,
  GetAlbumDto,
} from "./dto/create-album.dto";
import {
  ListAlbumSuccessResponse,
  ListAlbumErrorResponse,
  GetAlbumSuccessResponse,
  GetAlbumErrorResponse,
} from "./dto/list-album.dto";

import {
  GeneralHelperService,
  HttpExceptionFilter,
  Message,
  HttpStatus,
  ErrorCode,
} from "../../common/index.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

const send = GeneralHelperService.sendResponse;
@ApiTags("Admin/Album")
@ApiBearerAuth("JWT")
@Controller("admin/album")
export class AlbumController {
  constructor(private readonly albumService: AlbumService) { }

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
  @ApiOperation({ summary: "Add new album" })
  @ApiResponse({ status: 200, type: AlbumSuccessResponse })
  @ApiResponse({ status: 400, type: AlbumErrorResponse })
  async create(@Res() res: any,
    @UploadedFiles() file: Express.Multer.File,
    @Body() createAlbumDto: CreateAlbumDto) {
    const album: any = await this.albumService.create(createAlbumDto, file);
    if (album) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { "id": album });
    }
    throw new BadRequestException(ErrorCode.ALREADY_EXIST_CODE, Message.ALBUM_EXIT_MESSAGE);
  }

  @Get()
  @ApiOperation({ summary: "List of album" })
  @ApiResponse({ status: 200, type: ListAlbumSuccessResponse })
  @ApiResponse({ status: 400, type: ListAlbumErrorResponse })
  async findAll(@Res() res: any) {
    const album = await this.albumService.findAll();
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { list: album });
  }

  @Get("get/:id")
  @ApiOperation({ summary: "Get album" })
  @ApiResponse({ status: 200, type: GetAlbumSuccessResponse })
  @ApiResponse({ status: 400, type: GetAlbumErrorResponse })
  async findOne(@Res() res: any, @Param() GetAlbumId: GetAlbumDto) {
    const getAlbum = await this.albumService.findOne(GetAlbumId.id);
    if (getAlbum) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, getAlbum);
    }
    throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
  }

  @Patch("update/:id")
  @ApiOperation({ summary: "Update album" })
  @ApiResponse({ status: 200, type: AlbumSuccessResponse })
  @ApiResponse({ status: 400, type: AlbumErrorResponse })
  async update(
    @Res() res: any,
    @Param() GetAlbumId: GetAlbumIdDto,
    @Body() updateAlbumDto: UpdateAlbumDto
  ) {
    const albumUpdate = await this.albumService.update(
      GetAlbumId.id,
      updateAlbumDto
    );
    if (albumUpdate) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: albumUpdate });
    }
    throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.albumService.remove(+id);
  }
}
