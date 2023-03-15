import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateSingerDto } from "./dto/create-singer.dto";
import { UpdateSingerDto } from "./dto/update-singer.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Singer } from "./schemas/singer.schema";
import * as fs from 'fs';
import {
  Message,
  HttpStatus,
} from "../../common/index.service";
@Injectable()
export class SingerService {
  constructor(
    @InjectModel(Singer.name) private readonly SingerModel: Model<Singer>
  ) { }
  async create(createSingerDto: CreateSingerDto, files: any) {
    const checkSingerNameExist = await this.SingerModel.findOne({ name: createSingerDto.name });
    if (checkSingerNameExist) {
      throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.TITLE_ALREADY_EXIST)
    }
    const addSinger = new this.SingerModel();
    addSinger.name = createSingerDto.name;
    if (files) {
      addSinger.image = files.image[0].path;
    }
    addSinger.save();
    return addSinger._id;
  }

  async findAll() {
    const getSingers = await this.SingerModel.find(
      { isDeleted: false },
      { _id: 1, name: 1, image: { $concat: [process.env.BASE_URL, "$image"] } }
    );
    return getSingers;
  }

  async findOne(id: string): Promise<any> {
    const getSinger = await this.SingerModel.findOne(
      {
        _id: id,
        isDeleted: false,
      },
      { _id: 1, name: 1, image: { $concat: [process.env.BASE_URL, "$image"] } }
    );
    if (!getSinger) {
      return false;
    }
    return getSinger;
  }

  async update(id: string, updateSingerDto: UpdateSingerDto, files: any) {
    const checkSinger = await this.SingerModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!checkSinger) {
      return false;
    }
    checkSinger.name = updateSingerDto.name;
    if (files.image) {
      fs.unlink(checkSinger.image, function (err) {
        if (err) return console.log(err);
      });
      checkSinger.image = files.image[0].path;
    }
    checkSinger.save();
    return checkSinger._id;
  }

  async remove(id: string) {
    const checkSinger = await this.SingerModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!checkSinger) {
      return false;
    }
    checkSinger.isDeleted = true;
    checkSinger.save();
    return true;
  }
}
