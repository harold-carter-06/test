import { Message, HttpStatus, ErrorCode, GeneralHelperService } from '../../common/index.service'
import { Injectable, BadRequestException } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto, UpdateCategoryStatusDto } from "./dto/update-category.dto";
import { Category } from "./schemas/category.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SetSerachAndPagination } from './dto/list-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>
  ) { }

  public async create(createCategoryDto: CreateCategoryDto, files: any) {
    const checkCategoryExist = await this.categoryModel.findOne({
      name: createCategoryDto.name,
    });
    if (checkCategoryExist) {
      throw new BadRequestException(ErrorCode.ALREADY_EXIST_CODE, Message.CATEGORY_EXIT_MESSAGE);
    }
    const addCategory = new this.categoryModel(createCategoryDto);
    if (files.image) {
      addCategory.image = files.image[0].path;
    }
    await addCategory.save();
    return addCategory._id;
  }

  async findAll(setSearchAndPagination: SetSerachAndPagination) {
    const { perPage, page, skip } = await GeneralHelperService.parsePagination(setSearchAndPagination)

    const getCategories = await this.categoryModel.find(
      { isDeleted: false },
      { _id: 0, id: "$_id", name: 1, inFocus: 1, inTrending: 1, isActive: 1 }
    ).skip(skip).limit(perPage);

    const totalRecords = await this.categoryModel.find({ isDeleted: false }).countDocuments()
    const responseData = GeneralHelperService.paginateResponse(getCategories, totalRecords, perPage, page)
    return responseData;
  }

  async findOne(id: string): Promise<any> {
    const getCategory = await this.categoryModel.findOne(
      { _id: id, isDeleted: false },
      { _id: 0, id: "$_id", name: 1, inFocus: 1, inTrending: 1, isActive: 1 }
    );
    if (!getCategory) {
      throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
    }
    return getCategory;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, file: any) {
    const checkCategory = await this.categoryModel.findOne({ _id: id, isDeleted: false });
    if (!checkCategory) {
      throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
    }

    const checkCategoryName = await this.categoryModel.findOne({ _id: { $ne: id }, name: updateCategoryDto.name });
    if (checkCategoryName) {
      throw new BadRequestException(ErrorCode.ALREADY_EXIST_CODE, Message.CATEGORY_NAME_ALREADY_EXIST);
    }

    checkCategory.name = updateCategoryDto.name;
    checkCategory.inFocus = updateCategoryDto.inFocus;
    checkCategory.inTrending = updateCategoryDto.inTrending;
    if (file.image) {
      checkCategory.image = file.image[0].path;
    }
    checkCategory.save();
    return checkCategory._id;
  }

  async remove(id: string) {
    const checkCategory = await this.categoryModel.findOne({ _id: id, isDeleted: false });
    if (!checkCategory) {
      throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
    }
    checkCategory.isDeleted = true;
    checkCategory.save();
    return true;
  }

  async findAllCategoryName() {
    const getCategoriesNames = await this.categoryModel.find(
      { isDeleted: false },
      { _id: 0, id: "$_id", name: 1 }
    );
    return getCategoriesNames;
  }

  async updateStatus(id: string, updateCategoryStatusDto: UpdateCategoryStatusDto) {
    const checkCategory = await this.categoryModel.findOne({ _id: id, isDeleted: false });
    if (!checkCategory) {
      throw new BadRequestException(HttpStatus.NOT_FOUND, Message.NO_RECORD_FOUND);
    }
    checkCategory.isActive = Boolean(updateCategoryStatusDto.status);
    checkCategory.save();
    return checkCategory._id;
  }
}
