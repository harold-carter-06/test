import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Res, UseFilters, BadRequestException } from '@nestjs/common';
import { SongService } from './song.service';
import { CreateSongDto, SongSuccessResponse, SongErrorResponse } from './dto/create-song.dto';
import { GetSongIdDto, UpdateSongDto } from './dto/update-song.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { GeneralHelperService, HttpExceptionFilter, Message, HttpStatus } from '../../common/index.service'
import { GetsongSuccessResponse, GetsongErrorResponse, GetSongDto, ListsongSuccessResponse, ListsongErrorResponse } from './dto/list-song.dto';
const send = GeneralHelperService.sendResponse

@ApiTags("Admin/Song")
@Controller('admin/song')
@ApiBearerAuth('JWT')
export class SongController {
  constructor(private readonly songService: SongService) { }

  @Post()
  @UseFilters(new HttpExceptionFilter())
  @UseInterceptors(FileFieldsInterceptor([{ name: 'path', maxCount: 1 }, { name: 'coverImage', maxCount: 1 },], {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        console.log( 'cb', cb );
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('')
        return cb(null, `${randomName}${extname(file.originalname)}`)
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: "add song" })
  @ApiResponse({ status: 200, type: SongSuccessResponse })
  @ApiResponse({ status: 400, type: SongErrorResponse })
  async create(
    @Res() res: any,
    @UploadedFiles() file: Express.Multer.File,
    @Body() createSongDto: CreateSongDto) {
    const song: any = await this.songService.create(createSongDto, file);
    if (song) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { "id": song })
    }
    throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.SOMETHING_WENT_WRONG)
  }

  @Get()
  @ApiOperation({ summary: "list song" })
  @ApiResponse({ status: 200, type: ListsongSuccessResponse })
  @ApiResponse({ status: 400, type: ListsongErrorResponse })
  async find(@Res() res: any) {
    const song = await this.songService.findAll();
    if (song) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, song)
    }
    throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.SOMETHING_WENT_WRONG)
  }

  @Get(':id')
  @ApiOperation({ summary: "Get song" })
  @ApiResponse({ status: 200, type: GetsongSuccessResponse })
  @ApiResponse({ status: 400, type: GetsongErrorResponse })
  async findOne(@Param() getSongDto: GetSongDto, @Res() res: any,) {
    const song = await this.songService.findOne(getSongDto.id);
    if (song) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, song)
    }
    throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.SOMETHING_WENT_WRONG)
  }

  @Patch('update/:id')
  @UseFilters(new HttpExceptionFilter())
  @UseInterceptors(FileFieldsInterceptor([{ name: 'path', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }], {
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
  @ApiOperation({ summary: "Update song" })
  @ApiResponse({ status: 200, type: SongSuccessResponse })
  @ApiResponse({ status: 400, type: SongErrorResponse })
  async update(@Res() res: any,
    @Param() GetSongId: GetSongIdDto,
    @Body() updateSongDto: UpdateSongDto,
    @UploadedFiles() file: Express.Multer.File,) {
    const songUpdate = await this.songService.update(GetSongId.id, updateSongDto, file);
    if (songUpdate) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: songUpdate });
    }
    throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.SOMETHING_WENT_WRONG)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.songService.remove(+id);
  }
}
