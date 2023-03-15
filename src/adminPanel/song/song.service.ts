import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './schemas/song.schema'
import { Category } from '../../adminPanel/category/schemas/category.schema';
import * as fs from 'fs';
import * as mp3Duration from 'mp3-duration'
import { GeneralHelperService} from '../../common/index.service'

// var mp3Duration = require('mp3-duration');

import {
  Message,
  HttpStatus,
} from "../../common/index.service";
@Injectable()
export class SongService {
  constructor(
    @InjectModel(Song.name) private readonly songModel: Model<Song>,
    @InjectModel(Category.name) private readonly CategorySchema: Model<Category>,
  ) { }
  async create(createSongDto: CreateSongDto, files: any) {
    const checkSongTitle = await this.songModel.findOne({ title: createSongDto.title })
    if (checkSongTitle) {
      throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.TITLE_ALREADY_EXIST)
    }
    const checkCategory = await this.CategorySchema.findOne({ _id: createSongDto.categoryId, isDeleted: false })
    if (!checkCategory) {
      throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.CATEGORY_NOT_FOUND)
    }

    const addSong = new this.songModel();
    addSong.title = createSongDto.title;
    addSong.description = createSongDto.description;
    addSong.categoryId = createSongDto.categoryId;
    if (files.path) {
      addSong.coverImage = files.coverImage[0].path;
    }
    if (files.path) {
      await mp3Duration(files.path[0].path, async function (err:any, duration:number) {
        if (err) throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.SOMETHING_WENT_WRONG)
        addSong.duration =await GeneralHelperService.calculateDuration(duration)
      });
      addSong.path = files.path[0].path;

    }
    addSong.save()
    return addSong._id
  }

  async findAll() {
    const checkSongTitle = await this.songModel.find({ isDeleted: false }, { _id: 0, id: "$_id", title: 1, description: 1, categoryId: 1, coverImage: { $concat: [process.env.BASE_URL, "$coverImage"] }, songPath: { $concat: [process.env.BASE_URL, "$path"] } })
    return checkSongTitle
  }


  async findOne(id: string) {
    const checkSongTitle = await this.songModel.find({ isDeleted: false, _id: id }, { _id: 0, id: "$_id", title: 1, description: 1, categoryId: 1, coverImage: { $concat: [process.env.BASE_URL, "$coverImage"] }, songPath: { $concat: [process.env.BASE_URL, "$path"] } })
    return checkSongTitle[0]
  }

  async update(id: string, updateSongDto: UpdateSongDto, files: any) {
    const checkSong = await this.songModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!checkSong) {
      return false;
    }
    const checkCategory = await this.CategorySchema.findOne({ _id: updateSongDto.categoryId, isDeleted: false })
    if (!checkCategory) {
      throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.CATEGORY_NOT_FOUND)
    }
    checkSong.title = updateSongDto.title;
    checkSong.description = updateSongDto.description;
    checkSong.categoryId = updateSongDto.categoryId;
    if (files.path) {
      fs.unlink(checkSong.path, function (err) {
        if (err) return console.log(err);
      });
      await mp3Duration(files.path[0].path, async function (err:any, duration:any) {
        if (err) throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.SOMETHING_WENT_WRONG)
        checkSong.duration =await GeneralHelperService.calculateDuration(duration)
      });
      checkSong.path = files.path[0].path;
    }
    if (files.coverImage) {
      fs.unlink(checkSong.coverImage, function (err) {
        if (err) return console.log(err);
      });
      checkSong.path = files.coverImage[0].path;
    }
    checkSong.save();
    return checkSong._id;
  }

  remove(id: number) {
    return `This action removes a #${id} song`;
  }
}
