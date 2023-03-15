import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CreateSongSingerDto, SongSingerDto } from './dto/create-song-singer.dto';
import { UpdateSongSingerDto } from './dto/update-song-singer.dto';
import { SongSinger } from './schemas/song-singer.schema';
import { Song } from '../song/schemas/song.schema';
import { Singer } from '../singer/schemas/singer.schema';
import { GeneralHelperService, HttpExceptionFilter, Message, HttpStatus } from '../../common/index.service';
const send = GeneralHelperService.sendResponse

@Injectable()
export class SongSingerService {
  constructor(
    @InjectModel(SongSinger.name) private readonly SongSingerModel: Model<SongSinger>,
    @InjectModel(Song.name) private readonly SongModel: Model<Song>,
    @InjectModel(Singer.name) private readonly SingerModel: Model<Singer>
  ) { }
  async create(createSongSingerDto: CreateSongSingerDto) {
    const checksong = await this.SongModel.findOne({ _id: createSongSingerDto.songId })
    if (!checksong) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.SONG_NOT_EXIST,
      )
    }
    var singerIds = createSongSingerDto.singerId.split(",")
    var songSingerArr = []  
    singerIds.map((item) => {
      var songSingerObj = {
        songId: checksong._id,
        singerId: item
      }
      songSingerArr.push(songSingerObj)
    })

    await this.SongSingerModel.insertMany(songSingerArr)
    return true
  }

  async findAll() {
    const songSingerData = await this.SongSingerModel.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $lookup: {
          from: 'songs',
          localField: 'songId',
          foreignField: "_id",
          as: "song"
        }
      },
      {
        $lookup: {
          from: 'singers',
          localField: 'singerId',
          foreignField: "_id",
          as: "singer"
        }
      },
      // {
      //   $group:{
      //     _id:"$songId",
      //     song: {
      //         $first:{ $arrayElemAt: ["$song.title", 0] } 
      //     },
      //     singer: {
      //       $push: {
      //         "singerName": { $arrayElemAt: ["$singer.name", 0] },
      //       }
      //     }
      //   }
      // },
      // {
      //   $project:{
      //     _id:"$_id",
      //     song:"$song",
      //     singer:"$singer"
      //   }
      // }
      {
        $project: {
          _id: "$_id",
          songId: "$songId",
          singerId: "$singerId",
          songTitle: { $arrayElemAt: ["$song.title", 0] },
          singerName: { $arrayElemAt: ["$singer.name", 0] },
        }
      }
    ])
    return songSingerData
  }

  async findOne(id: string) {
    const songSingerData = await this.SongSingerModel.aggregate([
      {
        $match: { isDeleted: false, _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: 'songs',
          localField: 'songId',
          foreignField: "_id",
          as: "song"
        }
      },
      {
        $lookup: {
          from: 'singers',
          localField: 'singerId',
          foreignField: "_id",
          as: "singer"
        }
      },
      {
        $project: {
          _id: "$_id",
          songId: "$songId",
          singerId: "$singerId",
          songTitle: { $arrayElemAt: ["$song.title", 0] },
          singerName: { $arrayElemAt: ["$singer.name", 0] },
        }
      }
    ])
    return songSingerData[0]
  }

  async update(id: string, updateSongSingerDto: UpdateSongSingerDto) {
    const checksong = await this.SongModel.findOne({ _id: updateSongSingerDto.songId })
    if (!checksong) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.SONG_NOT_EXIST,
      )
    }
    const checkSongSingerExist: any = await this.SongSingerModel.findOne({ songId: updateSongSingerDto.songId, singerId: updateSongSingerDto.singerId, _id: { $ne: new mongoose.Types.ObjectId(id) } })
    if (checkSongSingerExist) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.SONG_SINGER_ALREADY_EXIST,
      )
    }
    checkSongSingerExist.songId = updateSongSingerDto.songId;
    checkSongSingerExist.singerId = updateSongSingerDto.singerId;
    checkSongSingerExist.save();
    return checkSongSingerExist._id
  }

  async remove(id: string) {
    const checkSongSingerExist: any = await this.SongSingerModel.findOne({ _id: new mongoose.Types.ObjectId(id), isDeleted: false })
    if (!checkSongSingerExist) {
      throw new BadRequestException(
        HttpStatus.BAD_REQUEST,
        Message.SONG_SINGER_NOT_FOUND,
      )
    }
    checkSongSingerExist.isDeleted = true;
    await checkSongSingerExist.save();
    return true;
  }

}
