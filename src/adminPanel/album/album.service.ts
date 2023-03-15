import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateAlbumDto } from "./dto/create-album.dto";
import { UpdateAlbumDto } from "./dto/update-album.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Album } from "./schemas/album.schema";
import {
  GeneralHelperService,
  HttpExceptionFilter,
  Message,
  HttpStatus,
  ErrorCode,
} from "../../common/index.service";
@Injectable()
export class AlbumService {
  constructor(
    @InjectModel(Album.name) private readonly AlbumModel: Model<Album>
  ) { }
  async create(createAlbumDto: CreateAlbumDto, files: any) {
    const checkAlbumNameExist = await this.AlbumModel.findOne({ title: createAlbumDto.title });
    if (checkAlbumNameExist) {
      throw new BadRequestException(HttpStatus.BAD_REQUEST, Message.TITLE_ALREADY_EXIST)
    }
    const addAlbum = new this.AlbumModel();
    addAlbum.title = createAlbumDto.title;
    addAlbum.description = createAlbumDto.description;
    if (files) {
      addAlbum.image = files.image[0].path;
    }
    addAlbum.save();
    return addAlbum._id;
  }

  async findAll() {
    const getAlbum = await this.AlbumModel.find(
      {
        isDeleted: false,
      },
      { _id: 0, id: "$_id", title: 1, description: 1, isActive: 1 }
    );
    return getAlbum;
  }

  async findOne(id: string): Promise<any> {
    const getAlbum = await this.AlbumModel.findOne(
      {
        _id: id,
        isDeleted: false,
      },
      { _id: 0, id: "$_id", title: 1, description: 1, isActive: 1 }
    );
    if (!getAlbum) {
      return false;
    }
    return getAlbum;
  }

  async update(id: string, updateAlbumDto: UpdateAlbumDto) {
    const checkAlbum = await this.AlbumModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!checkAlbum) {
      return false;
    }
    checkAlbum.title = updateAlbumDto.title;
    checkAlbum.description = updateAlbumDto.description;
    checkAlbum.save();
    return checkAlbum._id;
  }

  remove(id: number) {
    return `This action removes a #${id} album`;
  }
}
