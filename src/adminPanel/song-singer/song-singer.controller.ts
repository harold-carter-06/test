import { Controller, Get, Post, Body, Patch, Param, Delete, UseFilters, Res, InternalServerErrorException } from '@nestjs/common';
import { SongSingerService } from './song-singer.service';
import { CreateSongSingerDto } from './dto/create-song-singer.dto';
import { UpdateSongSingerDto } from './dto/update-song-singer.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SongSingerSuccessResponse, SongSingerErrorResponse, SongSingerDto } from './dto/create-song-singer.dto';
import { GeneralHelperService, HttpExceptionFilter, Message, HttpStatus } from '../../common/index.service'
const send = GeneralHelperService.sendResponse

@ApiTags("Admin/Song-singer")
@ApiBearerAuth("JWT")
@Controller('admin/song-singer')
@UseFilters(new HttpExceptionFilter())
export class SongSingerController {
  constructor(private readonly songSingerService: SongSingerService) { }

  @Post()
  @ApiOperation({ summary: "Add song singer" })
  @ApiResponse({ status: 200, type: SongSingerSuccessResponse })
  @ApiResponse({ status: 400, type: SongSingerErrorResponse })
  async create(@Res() res: any, @Body() createSongSingerDto: CreateSongSingerDto) {
    const songSinger: any = await this.songSingerService.create(createSongSingerDto);
    if (songSinger) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, Message.SUCCESS)
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG)
  }

  @Get()
  async findAll(@Res() res: any) {
    const songSinger = await this.songSingerService.findAll();
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, songSinger)
  }

  @Get(':id')
  async findOne(@Param() getSongSingerId: SongSingerDto, @Res() res: any) {
    const songSingerData = await this.songSingerService.findOne(getSongSingerId.id);
    if (songSingerData) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, songSingerData)
    }
    return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.NO_RECORD_FOUND, null)
  }

  @Patch(':id')
  async update(@Param() getSongSingerId: SongSingerDto, @Res() res: any, @Body() updateSongSingerDto: UpdateSongSingerDto) {
    const updateSongSinger: any = await this.songSingerService.update(getSongSingerId.id, updateSongSingerDto);
    if (updateSongSinger) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, { id: updateSongSinger })
    }
    throw new InternalServerErrorException(HttpStatus.INTERNAL_SERVER_ERROR, Message.SOMETHING_WENT_WRONG)

  }

  @Delete(':id')
  async remove(@Param() getSongSingerId: SongSingerDto, @Res() res: any,) {
    const deleteSongSinger: any = await this.songSingerService.remove(getSongSingerId.id);
    if (deleteSongSinger) {
      return send(res, HttpStatus.SUCCESS, HttpStatus.SUCCESS, Message.SUCCESS, null)
    }
  }
}
