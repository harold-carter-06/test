import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/models/user.model';
import {
  addItemDTO,
  deleteItemDTO,
  updateItemDTO,
  getAllItemResponse,
  getAllItemsParamsDTO,
} from './item-all.dto';
import { ItemTypes } from './item-types';
import { Item } from './models/item.model';
import { GeneralHelperService } from '../helper/general-helper.service';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import * as csv from 'fast-csv';
import * as fs from 'fs';
import * as path from 'path';

export interface getItemResponse {
  type: ItemTypes;
  domain: string;
  name: string;
  cost: number;
  cost_decimals: number;
  markup_percent: number;
  unit_price: number;
  desc: string;
  fields: any[];
  createdByUser: string;
  createdByUserId: string;
  id: string;
}

@Injectable()
export class ItemService {
  constructor(
    @InjectModel('Items') private itemModel: Model<Item>,
    @InjectModel('Users') private userModel: Model<User>,
    @InjectModel('CommonSettings')
    private commonSettingsModel: Model<CommonSettings>,
  ) {}

  async getAllItems(
    user: User,
    getAllItemsParamsDTO: getAllItemsParamsDTO,
  ): Promise<getAllItemResponse> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });

    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    // sorting
    const { sortObj } = await GeneralHelperService.parseSort(
      getAllItemsParamsDTO.sortType,
      getAllItemsParamsDTO.sortField,
    );

    // pagination
    const { page, limit } = await GeneralHelperService.parsePagination(
      getAllItemsParamsDTO.page,
      getAllItemsParamsDTO.limit,
    );
    try {
      const filter: any = {
        domain: findUser.domain,
        is_deleted: false,
      };
      if (
        getAllItemsParamsDTO.searchType &&
        getAllItemsParamsDTO.searchType != undefined
      ) {
        filter.$or = await GeneralHelperService.prepareSearchFilter(
          getAllItemsParamsDTO.searchType,
          ['type'],
        );
      }

      const dataItem: any = await this.itemModel.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdByUserId',
            foreignField: '_id',
            as: 'createdByUser',
          },
        },
        {
          $unwind: '$createdByUser',
        },
        {
          $facet: {
            metadata: [
              { $count: 'total_count' },
              { $addFields: { page: page } },
            ],
            data: [
              { $skip: page * limit },
              { $limit: limit },
              { $sort: sortObj },
              {
                $project: {
                  _id: 0,
                  id: '$_id',
                  type: 1,
                  domain: 1,
                  name: 1,
                  cost: 1,
                  cost_decimals: 1,
                  desc: 1,
                  fields: 1,
                  createdByUserId: 1,

                  createdByUser: {
                    $concat: [
                      '$createdByUser.firstName',
                      ' ',
                      '$createdByUser.lastName',
                    ],
                  },
                },
              },
            ],
          },
        },
      ]);

      const tempObjectNew = await GeneralHelperService.prepareResponse(
        dataItem,
      );
      return tempObjectNew;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }
  async addItem(addItem: addItemDTO, user: User): Promise<getItemResponse> {
    const { name, cost, cost_decimals, desc, fields, type, markup_percent } =
      addItem;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: findUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }
    let unitPrice = cost;
    if (findCommonSettings.is_product_service) {
      unitPrice = cost + cost / markup_percent;
    }

    try {
      const newItem = await new this.itemModel();
      newItem.name = name;
      newItem.cost = cost;
      newItem.cost_decimals = cost_decimals;
      newItem.desc = desc;
      newItem.createdByUserId = findUser._id;
      newItem.lastUpdatedByUserId = findUser._id;
      newItem.fields = fields;
      newItem.domain = findUser.domain;
      newItem.type = type as ItemTypes;
      newItem.markup_percent = markup_percent;
      newItem.unit_price = unitPrice;
      const savedItem = await newItem.save();
      return {
        ...savedItem,
        id: savedItem._id,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async updateItem(
    updateItem: updateItemDTO,
    user: User,
  ): Promise<getItemResponse> {
    const {
      name,
      cost,
      cost_decimals,
      desc,
      fields,
      type,
      id,
      markup_percent,
    } = updateItem;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: findUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }
    const findProduct = await this.itemModel.findOne({
      domain: findUser.domain,
      _id: id,
      is_deleted: false,
    });
    if (!findProduct) {
      throw new NotFoundException('Item not found');
    }
    let unitPrice = cost;
    if (findCommonSettings.is_product_service) {
      unitPrice = cost + cost / markup_percent;
    }
    try {
      findProduct.name = name;
      findProduct.cost = cost;
      findProduct.cost_decimals = cost_decimals;
      findProduct.desc = desc;
      findProduct.lastUpdatedByUserId = findUser._id;
      findProduct.fields = fields;
      findProduct.domain = findUser.domain;
      findProduct.type = type as ItemTypes;
      findProduct.markup_percent = markup_percent;
      findProduct.unit_price = unitPrice;
      await findProduct.save();
      return {
        id: findProduct._id,
        type: findProduct.type,
        domain: findProduct.domain,
        name: findProduct.name,
        cost: findProduct.cost,
        cost_decimals: findProduct.cost_decimals,
        desc: findProduct.desc,
        fields: findProduct.fields,
        markup_percent: findProduct.markup_percent,
        unit_price: findProduct.unit_price,
        createdByUser: `${findUser.firstName} ${findUser.lastName}`,
        createdByUserId: `${findUser._id}`,
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async deleteItem(deleteItems: deleteItemDTO, user: User): Promise<string> {
    const { ids } = deleteItems;
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    try {
      const deleteManyProducts = await this.itemModel.updateMany(
        {
          _id: {
            $in: [...ids],
          },
        },
        { is_deleted: true },
      );
      return 'Done';
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('something went wrong.');
    }
  }

  async importCSV(user: User, files: any): Promise<string> {
    const findUser = await this.userModel.findOne({
      domain: user.domain,
      email: user.email,
    });
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    const findCommonSettings = await this.commonSettingsModel.findOne({
      domain: findUser.domain,
    });
    if (!findCommonSettings) {
      throw new NotFoundException('Settings not found');
    }

    const fetchData: any = [];
    const filePath = path.resolve(__dirname, '..', '..', files.file[0].path);

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv.parse({
            headers: [
              'Name',
              'Description',
              'Cost',
              'Markup_Percent',
              'Taxable',
              'Category',
            ],
            renameHeaders: true,
            ignoreEmpty: true,
          }),
        )
        .validate(
          (data) =>
            data.Name !== '' &&
            data.Description !== '' &&
            data.Cost !== '' &&
            data.Markup_Percent !== '' &&
            data.Taxable !== '' &&
            (data.Category == 'SERVICE' || data.Category == 'PRODUCT'),
        )
        .on('data-invalid', (data) => {
          console.log(
            'data',
            'wrong format this was columns:' + Object.keys(data).length,
          );
        })
        .on('error', (err) => {
          console.error(err);
          reject(err);
        })

        .on('data', (row) => {
          fetchData.push(row);
        })
        .on('end', async () => {
          try {
            const itemArr: any = [];
            fetchData.forEach((element) => {
              const itemObj: any = {};
              let unitPrice = Number(element.Cost);
              if (findCommonSettings.is_product_service) {
                unitPrice = Number(element.Cost);
                Number(element.Cost) / Number(element.Markup_Percent);
              }
              itemObj.name = element.Name;
              itemObj.cost = Number(element.Cost);
              itemObj.desc = element.Description;
              itemObj.createdByUserId = findUser._id;
              itemObj.lastUpdatedByUserId = findUser._id;
              itemObj.domain = findUser.domain;
              itemObj.type = element.Category as ItemTypes;
              itemObj.markup_percent = Number(element.Markup_Percent);
              itemObj.unit_price = unitPrice;
              itemArr.push(itemObj);
            });
            await this.itemModel.insertMany(itemArr);
            fs.unlinkSync(filePath);
            resolve('ok');
          } catch (err) {
            console.log('err', err);
            throw new InternalServerErrorException('something went wrong.');
          }
        });
    });
  }
}
