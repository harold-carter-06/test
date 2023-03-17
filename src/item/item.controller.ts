import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Put,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { requestManager } from '../request-manager/request-manager';
import { RolesGuard } from '../guards/roles.guard';
import { Roles, RoleTypes } from '../roles.decorator';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/models/user.model';
import {
  addItemDTO,
  deleteItemDTO,
  updateItemDTO,
  getAllItemResponse,
  getAllItemsParamsDTO,
  importCSVDto,
} from './item-all.dto';
import { getItemResponse, ItemService } from './item.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller(requestManager.item.controllerPath)
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Post(requestManager.item.methods.addItem.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.item.methods.addItem.roles)
  async addItem(
    @GetUser() user: User,
    @Body(ValidationPipe) addProductDTO: addItemDTO,
  ): Promise<getItemResponse> {
    return await this.itemService.addItem(addProductDTO, user);
  }

  @Put(requestManager.item.methods.updateItem.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.item.methods.updateItem.roles)
  async updateItem(
    @GetUser() user: User,
    @Body(ValidationPipe) updateProductDTO: updateItemDTO,
  ): Promise<getItemResponse> {
    return await this.itemService.updateItem(updateProductDTO, user);
  }

  @Delete(requestManager.item.methods.deleteItem.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.item.methods.deleteItem.roles)
  async deleteItems(
    @GetUser() user: User,
    @Body(ValidationPipe) deleteProductDTO: deleteItemDTO,
  ): Promise<string> {
    return await this.itemService.deleteItem(deleteProductDTO, user);
  }

  @Get(requestManager.item.methods.getAllItems.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.item.methods.getAllItems.roles)
  async getAllItems(
    @GetUser() user: User,
    @Query() getAllItemsParamsDTO: getAllItemsParamsDTO,
  ): Promise<getAllItemResponse> {
    return await this.itemService.getAllItems(user, getAllItemsParamsDTO);
  }

  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 1 }], {
      storage: diskStorage({
        destination: function (req, file, cb) {
          const dir = './uploads/temp';
          fs.mkdirSync(dir, { recursive: true });
          return cb(null, dir);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @Post(requestManager.item.methods.importCSV.path)
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(requestManager.item.methods.importCSV.roles)
  @ApiConsumes('multipart/form-data')
  async importCSV(
    @UploadedFiles() file: Express.Multer.File,
    @GetUser() user: User,
    @Body() importCSVDto: importCSVDto,
  ) {
    return await this.itemService.importCSV(user, file);
  }
}
